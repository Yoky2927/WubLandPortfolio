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
import BrokerChatInterface from "../../components/BrokerChatInterface";
import ScheduleViewingModal from "../../components/ScheduleViewingModal";
import HeroTypingText from "../../components/HeroTypingText";
import AnnouncementBanner from '../../components/AnnouncementBanner';

import { toast } from "react-hot-toast";
import {
  ChevronDown, ChevronRight, ArrowRight, ArrowLeft, CheckCircle,
  Home, Users, FileText, Calendar, MapPin, DollarSign,
  ShieldCheck, Star, Phone, Mail, Award, Clock, Eye,
  MessageCircle, X, Upload, Camera, Search, Filter,
  AlertCircle, AlertTriangle, RefreshCw,
  Loader as LoaderIcon, Lock, TrendingUp, Shield, Sparkles, FileCheck,
  Handshake, Check, HelpCircle, Plus,
  Zap, Globe, Languages, Briefcase, Key,
  CheckCircle as CheckCircle2, FileEdit, UserCheck
} from "lucide-react";

const BrokerChatToggle = ({ theme, onToggle, brokerName, brokerProfile, unreadCount }) => {
  return (
    <button
      onClick={onToggle}
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 ${theme === "dark"
        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
        : "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
        }`}
    >
      <MessageCircle className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
};

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
  const [brokerChatOpen, setBrokerChatOpen] = useState(false);

  // Modal states
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showScheduleViewingModal, setShowScheduleViewingModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVerificationRestriction, setShowVerificationRestriction] = useState(false);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [selectedBrokerForModal, setSelectedBrokerForModal] = useState(null);

  // Data States
  const [brokers, setBrokers] = useState([]);

  // Interactive state
  const [activeInfoCard, setActiveInfoCard] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scrolledProgress, setScrolledProgress] = useState(0);
  const [isVerificationInProgress, setIsVerificationInProgress] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [lastVerificationCheck, setLastVerificationCheck] = useState(null);

  // Step 2 specific state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [filteredBrokers, setFilteredBrokers] = useState([]);

  // Property Request State
  const [propertyRequest, setPropertyRequest] = useState({
    id: null,
    status: 'draft',
    currentStep: 1,
    propertyData: {},
    brokerId: null,
    brokerName: null,
    verificationDate: null,
    inspectionStatus: 'pending',
    inspectionReport: null,
    listingProposal: null,
    adminApproval: null,
    contractDetails: null,
    paymentStatus: null,
    stepCompletion: [true, false, false, false, false, false, false]
  });

  // Form Data
  const [formData, setFormData] = useState({
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
    features: []
  });

  const [formErrors, setFormErrors] = useState({});

  // Refs
  const progressSectionRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false
  });

  // ========== HELPER FUNCTIONS ==========

  const getVerificationStepTitle = () => {
    if (!verificationStatus) {
      return hasSubmittedDocuments ? "Verification in Progress" : "Verify Identity";
    }

    switch (verificationStatus.status) {
      case 'verified': return 'Verified';
      case 'needs_resubmission': return 'Resubmission Required';
      case 'reviewing': return 'Under Review';
      case 'submitted': return 'Submitted';
      case 'rejected': return 'Verification Rejected';
      default: return 'Verify Identity';
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
      case 'verified': return 'Identity verified successfully';
      case 'needs_resubmission': return verificationStatus.feedback || 'Please resubmit documents';
      case 'reviewing': return 'Your documents are being reviewed';
      case 'submitted': return 'Documents submitted - awaiting review';
      case 'rejected': return verificationStatus.feedback || 'Verification was not approved';
      default: return 'Upload required documents';
    }
  };

  const getVerificationStepColor = () => {
    if (!verificationStatus) {
      return hasSubmittedDocuments ? "from-amber-800 to-amber-500" : "from-amber-800 to-amber-500";
    }

    switch (verificationStatus.status) {
      case 'verified': return "from-green-500 to-green-600";
      case 'needs_resubmission': return "from-amber-500 to-amber-600";
      case 'reviewing': return "from-blue-500 to-blue-600";
      case 'submitted': return "from-purple-500 to-purple-600";
      case 'rejected': return "from-red-500 to-red-600";
      default: return "from-amber-800 to-amber-500";
    }
  };

  const getVerificationStepIconColor = () => {
    if (!verificationStatus) {
      return hasSubmittedDocuments ? "text-amber-400" : "text-amber-500";
    }

    switch (verificationStatus.status) {
      case 'verified': return "text-green-500";
      case 'needs_resubmission': return "text-amber-500";
      case 'reviewing': return "text-blue-500";
      case 'submitted': return "text-purple-500";
      case 'rejected': return "text-red-500";
      default: return "text-amber-500";
    }
  };

  // ========== VERIFICATION FUNCTIONS ==========

  const checkVerificationStatus = useCallback(async (forceCheck = false) => {
    if (!user?.id) return null;

    try {
      const now = Date.now();
      const lastCheck = lastVerificationCheck || 0;
      const timeSinceLastCheck = now - lastCheck;

      if (!forceCheck && timeSinceLastCheck < 10000) {
        return verificationStatus;
      }

      if (verificationStatus?.status === 'verified') {
        return verificationStatus;
      }

      const response = await apiCall('GET_VERIFICATION_STATUS', {}, { method: 'GET' });

      if (!response) {
        console.log('❌ Verification status check returned no response');
        return verificationStatus;
      }

      if (!response.success) {
        console.log('❌ Verification status check failed:', response.message);
        return verificationStatus;
      }

      const { user: userData, documents, verificationStep } = response;

      if (!userData) {
        console.log('❌ No user data in verification response');
        return verificationStatus;
      }

      const updatedUser = {
        ...user,
        verification_status: userData.verification_status || userData.verificationStepStatus || null,
        verification_step_status: userData.verification_step_status || userData.verificationStepStatus || 'not_started',
        verification_feedback: userData.verification_feedback || null,
        documents_need_resubmission: userData.documents_need_resubmission || false,
        has_submitted_documents: userData.has_submitted_documents || false,
        documents_submitted_at: userData.documents_submitted_at || null,
        last_verification_review_at: userData.last_verification_review_at || null
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (documents && Array.isArray(documents)) {
        setUserDocuments(documents);
        localStorage.setItem(`user_documents_${user.id}`, JSON.stringify(documents));
      }

      const hasSubmitted =
        userData.verification_status === 'pending' ||
        userData.verification_status === 'submitted' ||
        userData.verification_status === 'reviewing' ||
        userData.has_submitted_documents === true;

      const isPending =
        userData.verification_step_status === 'pending' ||
        userData.verification_step_status === 'submitted' ||
        userData.verification_step_status === 'reviewing' ||
        userData.verification_step_status === 'needs_resubmission';

      setHasSubmittedDocuments(hasSubmitted);
      setIsVerificationInProgress(isPending);

      const isStep2Completed = userData.verification_step_status === 'verified';
      if (isStep2Completed !== completedSteps[2]) {
        setCompletedSteps(prev => {
          const updated = { ...prev, 2: isStep2Completed };
          localStorage.setItem('completed_steps', JSON.stringify(updated));
          return updated;
        });
      }

      const statusData = {
        status: userData.verification_step_status || 'not_started',
        feedback: userData.verification_feedback || null,
        needsResubmission: userData.documents_need_resubmission || false,
        lastReviewed: userData.last_verification_review_at || null,
        stepInfo: verificationStep,
        hasSubmitted: hasSubmitted,
        isInProgress: isPending,
        lastChecked: now
      };

      setVerificationStatus(statusData);
      setLastVerificationCheck(now);

      localStorage.setItem(`verification_status_${user.id}`, JSON.stringify(statusData));

      const previousStatus = verificationStatus?.status;
      if (previousStatus && previousStatus !== userData.verification_step_status) {
        handleVerificationStatusChange(previousStatus, userData.verification_step_status, userData.verification_feedback);
      }

      return statusData;
    } catch (error) {
      console.error('Error checking verification status:', error);

      if (verificationStatus) {
        return verificationStatus;
      }

      return {
        status: 'not_started',
        feedback: null,
        needsResubmission: false,
        lastReviewed: null,
        hasSubmitted: false,
        isInProgress: false,
        lastChecked: Date.now()
      };
    }
  }, [user, verificationStatus, lastVerificationCheck, completedSteps]);

  const validateAndUpdateSteps = useCallback(async () => {
    if (!user) return;

    console.log('🔍 Validating and updating steps...');

    // Step 1: Check if profile is complete
    const isProfileComplete = user.first_name &&
      user.last_name &&
      user.phone_number;

    if (isProfileComplete !== completedSteps[1]) {
      console.log(`🔄 Step 1: ${isProfileComplete ? 'Complete' : 'Incomplete'}`);
      setCompletedSteps(prev => {
        const updated = { ...prev, 1: isProfileComplete };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });
    }

    // Step 2: Check verification status
    const isVerified = verificationStatus?.status === 'verified';
    if (isVerified !== completedSteps[2]) {
      console.log(`🔄 Step 2: ${isVerified ? 'Complete' : 'Incomplete'}`);
      setCompletedSteps(prev => {
        const updated = { ...prev, 2: isVerified };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });
    }

    // Step 3: Check if user has property request
    const hasPropertyRequest = propertyRequest.id !== null;
    if (hasPropertyRequest !== completedSteps[3]) {
      console.log(`🔄 Step 3: ${hasPropertyRequest ? 'Complete' : 'Incomplete'}`);
      setCompletedSteps(prev => {
        const updated = { ...prev, 3: hasPropertyRequest };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });
    }

    // Step 4: Check if broker is assigned
    const hasBrokerAssigned = propertyRequest.brokerId !== null;
    if (hasBrokerAssigned !== completedSteps[4]) {
      console.log(`🔄 Step 4: ${hasBrokerAssigned ? 'Complete' : 'Incomplete'}`);
      setCompletedSteps(prev => {
        const updated = { ...prev, 4: hasBrokerAssigned };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });
    }

    // Step 5: Check if inspection is scheduled
    const hasInspectionScheduled = propertyRequest.verificationDate !== null;
    if (hasInspectionScheduled !== completedSteps[5]) {
      console.log(`🔄 Step 5: ${hasInspectionScheduled ? 'Complete' : 'Incomplete'}`);
      setCompletedSteps(prev => {
        const updated = { ...prev, 5: hasInspectionScheduled };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });
    }

    // Step 6: Check if inspection is completed
    const hasInspectionCompleted = propertyRequest.inspectionStatus === 'completed';
    if (hasInspectionCompleted !== completedSteps[6]) {
      console.log(`🔄 Step 6: ${hasInspectionCompleted ? 'Complete' : 'Incomplete'}`);
      setCompletedSteps(prev => {
        const updated = { ...prev, 6: hasInspectionCompleted };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });
    }

    // Step 7: Check if listing is approved
    const hasListingApproved = propertyRequest.adminApproval === 'approved';
    if (hasListingApproved !== completedSteps[7]) {
      console.log(`🔄 Step 7: ${hasListingApproved ? 'Complete' : 'Incomplete'}`);
      setCompletedSteps(prev => {
        const updated = { ...prev, 7: hasListingApproved };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });
    }

    console.log('✅ Step validation complete:', completedSteps);
  }, [user, verificationStatus, propertyRequest, completedSteps]);

  const handleVerificationStatusChange = (oldStatus, newStatus, feedback) => {
    switch (newStatus) {
      case 'verified':
        toast.success('🎉 Verification Complete! Your identity has been verified successfully.', {
          duration: 5000,
          icon: '✅'
        });
        break;

      case 'needs_resubmission':
        toast.error(`🔄 Verification Needs Resubmission`, {
          duration: 6000,
          description: feedback || 'Please resubmit your documents with corrections',
          icon: '📄'
        });
        break;

      case 'rejected':
        toast.error('❌ Verification Rejected', {
          duration: 6000,
          description: feedback || 'Please contact support for more information',
          icon: '❌'
        });
        break;

      case 'reviewing':
        toast('🔍 Your documents are now being reviewed by our team', {
          duration: 4000,
          icon: '👀'
        });
        break;
    }
  };

  // ========== STEP DEFINITIONS ==========

  const getStepConfig = useCallback(() => {
    const steps = {
      seller: [
        { number: 1, title: "Property Details", description: "Tell us about your property", icon: Home },
        { number: 2, title: "Choose Broker", description: "Select your preferred broker", icon: Users },
        { number: 3, title: "Schedule Inspection", description: "Book property verification", icon: Calendar },
        { number: 4, title: "Property Inspection", description: "Broker verification process", icon: ShieldCheck },
        { number: 5, title: "Listing Proposal", description: "Review listing details", icon: FileText },
        { number: 6, title: "Admin Approval", description: "Final listing approval", icon: CheckCircle },
        { number: 7, title: "Contract & Payment", description: "Finalize transaction", icon: Handshake }
      ],
      leaser: [
        { number: 1, title: "Property Details", description: "Tell us about your rental", icon: Home },
        { number: 2, title: "Choose Broker", description: "Select rental specialist", icon: Users },
        { number: 3, title: "Schedule Inspection", description: "Book property verification", icon: Calendar },
        { number: 4, title: "Property Inspection", description: "Broker verification process", icon: ShieldCheck },
        { number: 5, title: "Listing Proposal", description: "Review listing details", icon: FileText },
        { number: 6, title: "Admin Approval", description: "Final listing approval", icon: CheckCircle },
        { number: 7, title: "Lease Agreement", description: "Sign rental contract", icon: Handshake }
      ]
    };

    const currentUserSteps = steps[userType];

    return currentUserSteps.map((step) => {
      const stepNumber = step.number;
      let completed = false;
      let description = step.description;

      switch (stepNumber) {
        case 1:
          completed = formData.property_type && formData.location && formData.price;
          description = completed ? "Property details submitted" : step.description;
          break;
        case 2:
          completed = !!propertyRequest.brokerId;
          description = completed ? `Broker selected: ${propertyRequest.brokerName}` : step.description;
          break;
        case 3:
          completed = !!propertyRequest.verificationDate;
          description = completed ? "Inspection scheduled" : step.description;
          break;
        case 4:
          completed = propertyRequest.inspectionStatus === 'completed';
          description = completed ? "Inspection completed" : step.description;
          break;
        case 5:
          completed = !!propertyRequest.listingProposal;
          description = completed ? "Listing proposal ready" : step.description;
          break;
        case 6:
          completed = propertyRequest.adminApproval === 'approved';
          description = completed ? "Listing approved" : step.description;
          break;
        case 7:
          completed = propertyRequest.status === 'completed';
          description = completed ? "Transaction completed" : step.description;
          break;
      }

      return {
        number: stepNumber,
        title: step.title,
        description: description,
        icon: step.icon,
        completed: completed || completedSteps[stepNumber],
        color: completed ? "from-green-500 to-green-600" : "from-amber-800 to-amber-500",
        iconColor: completed ? "text-green-500" : "text-amber-500"
      };
    });
  }, [userType, formData, propertyRequest, completedSteps]);

  const currentSteps = getStepConfig();

  // Define handleStepClick after currentSteps is defined
  const handleStepClick = useCallback(async (stepNumber) => {
    if (stepNumber === 3 && isVerificationInProgress && verificationStatus?.status !== 'verified') {
      toast.error("Please wait for verification to complete before submitting property details");
      setShowVerificationRestriction(true);
      return;
    }
    setActiveStep(stepNumber);
  }, [isVerificationInProgress, verificationStatus]);

  // Filter and sort brokers effect
  useEffect(() => {
    let result = [...brokers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(broker =>
        broker.name?.toLowerCase().includes(query) ||
        broker.brokerage_firm?.toLowerCase().includes(query) ||
        broker.specialization?.some(spec => spec.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'experience':
        result.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
        break;
      case 'deals':
        result.sort((a, b) => (b.total_completed_deals || 0) - (a.total_completed_deals || 0));
        break;
      case 'commission':
        const getCommissionValue = (rate) => parseFloat(rate?.replace('%', '')) || 0;
        result.sort((a, b) => getCommissionValue(a.commission_rate) - getCommissionValue(b.commission_rate));
        break;
      default:
        result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    }

    setFilteredBrokers(result);
  }, [brokers, searchQuery, sortBy]);

  // ========== EFFECTS ==========

  useEffect(() => {
    if (verificationStatus?.status === 'verified' || completedSteps[2]) {
      setCanChangeUserType(false);
    }
  }, [verificationStatus?.status, completedSteps[2]]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resubmit = urlParams.get('resubmit');
    const docType = urlParams.get('documentType');

    if (resubmit === 'true' && docType) {
      setResubmissionDocument(docType);
      setActiveStep(2);
      setShowDocumentUpload(true);

      toast(`Please resubmit your ${docType}`, {
        duration: 5000,
        icon: '📄'
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

      window.addEventListener('focus', handleFocus);

      return () => {
        if (intervalId) clearInterval(intervalId);
        window.removeEventListener('focus', handleFocus);
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
        const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);

        if (rect.top <= viewHeight && rect.bottom >= 0) {
          const progress = 1 - (rect.bottom / (viewHeight + rect.height));
          setScrolledProgress(progress);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize
  useEffect(() => {
    const initializeDashboard = async () => {
      if (isInitializedRef.current) return;

      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        console.log('🚀 Initializing seller/leaser dashboard...', {
          hasToken: !!token,
          userId: userData?.id,
          userName: userData?.first_name || userData?.username
        });

        if (!token || !userData.id) {
          console.log('❌ No token or user data, redirecting to login');
          navigate("/login-register", {
            state: {
              returnUrl: "/seller-leaser",
              message: "Please login to list your property"
            }
          });
          return;
        }

        setUser(userData);

        // Set user type based on role
        if (userData.role === 'seller' || userData.role === 'landlord') {
          const typeFromRole = userData.role === 'seller' ? 'seller' : 'leaser';
          setUserType(typeFromRole);
          setFormData(prev => ({ ...prev, user_type: typeFromRole }));
          console.log(`👤 User type set to: ${typeFromRole}`);
        }

        // Initialize steps object
        let initialSteps = {
          1: false,
          2: false,
          3: false,
          4: false,
          5: false,
          6: false,
          7: false
        };

        // Load saved steps from localStorage
        const savedCompletedSteps = localStorage.getItem('completed_steps');
        if (savedCompletedSteps) {
          try {
            const parsedSteps = JSON.parse(savedCompletedSteps);
            const isNewUser = !parsedSteps || Object.keys(parsedSteps).length === 0;

            if (isNewUser) {
              console.log('👤 New user detected - initializing fresh steps');
              localStorage.removeItem('completed_steps');
              setCompletedSteps(initialSteps);
            } else {
              const validatedSteps = { ...initialSteps, ...parsedSteps };
              setCompletedSteps(validatedSteps);
              console.log('📋 Loaded and validated saved steps:', validatedSteps);
            }
          } catch (error) {
            console.error('❌ Error loading completed steps:', error);
            console.log('🔄 Starting with fresh steps due to error');
            localStorage.removeItem('completed_steps');
            setCompletedSteps(initialSteps);
          }
        } else {
          console.log('📋 No saved steps found - starting fresh');
          setCompletedSteps(initialSteps);
        }

        // Load cached data
        const cachedDocs = localStorage.getItem(`user_documents_${userData.id}`);
        const cachedBrokers = localStorage.getItem('cached_brokers');
        const cachedVerification = localStorage.getItem(`verification_status_${userData.id}`);
        const cachedPropertyRequest = localStorage.getItem(`property_request_${userData.id}`);

        if (cachedDocs) {
          try {
            const docs = JSON.parse(cachedDocs);
            if (Array.isArray(docs)) {
              setUserDocuments(docs);
              console.log('📄 Loaded cached documents:', docs.length);
            }
          } catch (e) {
            console.error('❌ Error parsing cached documents:', e);
          }
        }

        if (cachedVerification) {
          try {
            const verificationData = JSON.parse(cachedVerification);
            if (verificationData && typeof verificationData === 'object') {
              setVerificationStatus(verificationData);
              setHasSubmittedDocuments(verificationData.hasSubmitted || false);
              setIsVerificationInProgress(verificationData.isInProgress || false);
              setLastVerificationCheck(verificationData.lastChecked || null);

              console.log('✅ Loaded cached verification status:', verificationData.status);

              if (verificationData.status === 'verified' && !completedSteps[2]) {
                setCompletedSteps(prev => {
                  const updated = { ...prev, 2: true };
                  localStorage.setItem('completed_steps', JSON.stringify(updated));
                  console.log('✅ Step 2 marked as complete (cached verification)');
                  return updated;
                });
              }
            }
          } catch (e) {
            console.error('❌ Error parsing cached verification:', e);
          }
        }

        if (cachedBrokers) {
          try {
            const brokersData = JSON.parse(cachedBrokers);
            if (Array.isArray(brokersData)) {
              setBrokers(brokersData);
              console.log('🤝 Loaded cached brokers:', brokersData.length);
            }
          } catch (e) {
            console.error('❌ Error parsing cached brokers:', e);
          }
        }

        if (cachedPropertyRequest) {
          try {
            const requestData = JSON.parse(cachedPropertyRequest);
            if (requestData && typeof requestData === 'object') {
              setPropertyRequest(requestData);
              if (requestData.propertyData) {
                setFormData(prev => ({ ...prev, ...requestData.propertyData }));
              }
              console.log('✅ Loaded cached property request');
            }
          } catch (e) {
            console.error('❌ Error parsing property request:', e);
          }
        }

        // Check profile completion for step 1
        const isProfileComplete = userData.first_name &&
          userData.last_name &&
          userData.phone_number;

        console.log('👤 Profile completion check:', {
          first_name: !!userData.first_name,
          last_name: !!userData.last_name,
          phone_number: !!userData.phone_number,
          isComplete: isProfileComplete
        });

        if (isProfileComplete && !completedSteps[1]) {
          setCompletedSteps(prev => {
            const updated = { ...prev, 1: true };
            localStorage.setItem('completed_steps', JSON.stringify(updated));
            console.log('✅ Step 1 marked as complete (profile complete)');
            return updated;
          });
        }

        // Fetch fresh data
        console.log('🔄 Fetching fresh data...');
        const results = await Promise.allSettled([
          fetchBrokers().catch(err => console.error('❌ Error fetching brokers:', err)),
          checkVerificationStatus(true).catch(err => console.error('❌ Error checking verification:', err))
        ]);

        // After loading all data, do a final validation of steps
        await validateAndUpdateSteps();

        console.log('✅ Seller/Leaser dashboard initialization complete');
        console.log('📊 Final step status:', completedSteps);

      } catch (error) {
        console.error("❌ Initialization error:", error);

        if (error.message?.includes('Authentication') || error.message?.includes('401')) {
          console.log('🔒 Authentication error, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Please log in to list your property');
          navigate('/login-register');
        } else if (error.message?.includes('Network')) {
          toast.error("Network error. Please check your connection and try again.");
        } else {
          toast.error("Failed to load dashboard. Please try refreshing the page.");
        }
      } finally {
        setIsLoading(false);
        isInitializedRef.current = true;
        console.log('🏁 Dashboard initialization finished');
      }
    };

    const timer = setTimeout(() => {
      initializeDashboard();
    }, 100);

    return () => clearTimeout(timer);
  }, [checkVerificationStatus, navigate, validateAndUpdateSteps]);

  // ========== HANDLER FUNCTIONS ==========

  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const response = await apiCall('UPLOAD_PROFILE', {}, { data: formData });
      const updatedUser = { ...user, profile_picture: response.profilePictureUrl };
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
      const response = await apiCall('UPDATE_PROFILE', {}, { data: updates });
      if (response.success) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (updates.preferences) {
          localStorage.setItem(`user_preferences_${user.id}`, JSON.stringify(updates.preferences));
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
        setCompletedSteps(prev => {
          const updated = { ...prev, 1: true };
          localStorage.setItem('completed_steps', JSON.stringify(updated));
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
        toast.error("Verification is already in progress. Please wait for it to complete.");
        return;
      }

      let data;
      let isFormData = false;

      if (uploadData.url instanceof File) {
        const formData = new FormData();
        formData.append('document', uploadData.url);
        formData.append('documentType', uploadData.type);
        formData.append('isResubmission', uploadData.isResubmission || false);
        formData.append('filename', uploadData.filename || uploadData.url.name);

        data = formData;
        isFormData = true;

      } else if (typeof uploadData.url === 'string' && uploadData.url.startsWith('data:')) {
        data = {
          documentType: uploadData.type,
          documentUrl: uploadData.url,
          filename: uploadData.filename || 'document.jpg',
          isResubmission: uploadData.isResubmission || false
        };

      } else {
        data = {
          documentType: uploadData.type,
          documentUrl: uploadData.url,
          filename: uploadData.filename || 'document',
          isResubmission: uploadData.isResubmission || false
        };
      }

      const response = await apiCall('UPLOAD_VERIFICATION_DOCUMENT', {}, {
        method: 'POST',
        data: data,
        headers: isFormData ? {} : { 'Content-Type': 'application/json' }
      });

      if (response.success) {
        setHasSubmittedDocuments(true);
        setIsVerificationInProgress(true);

        await checkVerificationStatus(true);

        toast.success(response.message || "Documents submitted for verification! Our team will review them within 24-48 hours.", {
          duration: 5000,
          icon: '⏳'
        });

        setShowDocumentUpload(false);
        setActiveStep(2);
      } else {
        toast.error(response.message || "Failed to upload document");
      }
    } catch (error) {
      console.error('Error uploading document:', error);
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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateStep3 = () => {
    const errors = {};
    if (!formData.property_type) errors.property_type = "Property type is required";
    if (!formData.location || formData.location.trim().length < 3) errors.location = "Valid location is required";
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = "Valid price is required";
    if (!formData.property_images || formData.property_images.length < 3) errors.property_images = "Please upload at least 3 property photos";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPropertyRequest = useCallback(async () => {
    if (!validateStep3()) {
      toast.error("Please fix form errors");
      return;
    }

    setIsLoading(true);
    try {
      const propertyData = {
        property_type: formData.property_type,
        location: formData.location,
        price: parseFloat(formData.price),
        price_currency: formData.price_currency,
        verification_method: formData.verification_method,
        description: formData.description,
        beds: formData.beds,
        baths: formData.baths,
        sqft: formData.sqft,
        year_built: formData.year_built,
        amenities: formData.amenities,
        features: formData.features,
        user_type: formData.user_type
      };

      const response = await apiCall('CREATE_PROPERTY_REQUEST', {}, { data: { property_data: propertyData } });

      if (response.success) {
        const requestId = response.data?.request_id;
        if (!requestId) throw new Error("No request ID returned");

        // Upload images if any
        if (formData.property_images && formData.property_images.length > 0) {
          try {
            for (const image of formData.property_images) {
              const formDataToSend = new FormData();
              formDataToSend.append("image", image);
              await apiCall('UPLOAD_PROPERTY_IMAGE', { id: requestId }, { data: formDataToSend });
            }
          } catch (imageError) {
            console.warn("Image upload failed:", imageError);
          }
        }

        const updatedRequest = {
          ...propertyRequest,
          id: requestId,
          propertyData,
          status: 'property_submitted',
          stepCompletion: [true, true, true, false, false, false, false]
        };

        setPropertyRequest(updatedRequest);
        localStorage.setItem(`property_request_${user.id}`, JSON.stringify(updatedRequest));

        setCompletedSteps(prev => {
          const updated = { ...prev, 3: true };
          localStorage.setItem('completed_steps', JSON.stringify(updated));
          return updated;
        });

        setActiveStep(4);
        await fetchBrokers();
        toast.success("Property request submitted!");
      } else {
        throw new Error(response.message || "Failed to submit request");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  }, [formData, propertyRequest, user]);

  const fetchBrokers = async () => {
    try {
      const response = await apiCall('GET_BROKERS');

      let brokersData = [];
      if (response?.success && Array.isArray(response.brokers)) {
        brokersData = response.brokers;
      } else if (Array.isArray(response)) {
        brokersData = response;
      }

      const parsedBrokers = brokersData.map(broker => ({
        ...broker,
        specialization: Array.isArray(broker.specialization) ? broker.specialization :
          (broker.specialization ? JSON.parse(broker.specialization) : []),
        name: broker.name || `${broker.first_name || ''} ${broker.last_name || ''}`.trim() || 'Broker',
        average_rating: parseFloat(broker.rating || broker.average_rating || 4.5),
        total_completed_deals: broker.completed_deals || broker.total_completed_deals || 0,
        commission_rate: broker.commission_rate || '2.5%',
        is_available: Boolean(broker.is_available),
        is_verified: Boolean(broker.is_verified)
      }));

      setBrokers(parsedBrokers);
      localStorage.setItem('cached_brokers', JSON.stringify(parsedBrokers));
    } catch (error) {
      console.error("Broker fetch error:", error);
      toast.error("Failed to load brokers");
      setBrokers([]);
    }
  };

  const handleBrokerSelect = (broker) => {
    setSelectedBroker(broker);
    toast.success(`Selected broker: ${broker.name}`);
  };

  const handleConfirmBrokerSelection = async () => {
    if (!selectedBroker || !propertyRequest.id) {
      toast.error("Please select a broker and ensure property request exists");
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiCall('ASSIGN_BROKER', { id: propertyRequest.id }, {
        data: { brokerId: selectedBroker.id }
      });

      if (response.success) {
        const updatedRequest = {
          ...propertyRequest,
          brokerId: selectedBroker.id,
          brokerName: selectedBroker.name,
          status: 'broker_assigned',
          stepCompletion: [true, true, true, true, false, false, false]
        };

        setPropertyRequest(updatedRequest);
        localStorage.setItem(`property_request_${user.id}`, JSON.stringify(updatedRequest));

        setCompletedSteps(prev => {
          const updated = { ...prev, 4: true };
          localStorage.setItem('completed_steps', JSON.stringify(updated));
          return updated;
        });

        setActiveStep(5);
        toast.success("Broker assigned! You can now schedule inspection.");
      } else {
        throw new Error(response.message || "Failed to assign broker");
      }
    } catch (error) {
      console.error("Broker assignment error:", error);
      toast.error(error.message || "Failed to assign broker");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleInspection = async (viewingData) => {
    try {
      setIsLoading(true);

      const response = await apiCall('CREATE_INSPECTION_APPOINTMENT', {}, {
        data: {
          propertyRequestId: propertyRequest.id,
          brokerId: propertyRequest.brokerId,
          date: viewingData.date,
          time: viewingData.time,
          notes: viewingData.notes
        }
      });

      if (response.success) {
        const updatedRequest = {
          ...propertyRequest,
          verificationDate: `${viewingData.date} ${viewingData.time}`,
          status: 'inspection_scheduled',
          stepCompletion: [true, true, true, true, true, false, false]
        };

        setPropertyRequest(updatedRequest);
        localStorage.setItem(`property_request_${user.id}`, JSON.stringify(updatedRequest));

        setCompletedSteps(prev => {
          const updated = { ...prev, 5: true };
          localStorage.setItem('completed_steps', JSON.stringify(updated));
          return updated;
        });

        setActiveStep(6);
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

      const response = await apiCall('COMPLETE_INSPECTION', { id: propertyRequest.id }, {
        data: { report: report }
      });

      if (response.success) {
        const updatedRequest = {
          ...propertyRequest,
          inspectionStatus: 'completed',
          inspectionReport: report,
          status: 'inspection_completed',
          stepCompletion: [true, true, true, true, true, true, false]
        };

        setPropertyRequest(updatedRequest);
        localStorage.setItem(`property_request_${user.id}`, JSON.stringify(updatedRequest));

        setCompletedSteps(prev => {
          const updated = { ...prev, 6: true };
          localStorage.setItem('completed_steps', JSON.stringify(updated));
          return updated;
        });

        setActiveStep(7);
        toast.success("Inspection completed! Broker will prepare listing proposal.");
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
      const response = await apiCall('SUBMIT_LISTING_APPROVAL', { id: propertyRequest.id }, {
        data: {
          listingProposal: propertyRequest.listingProposal,
          approvedByUser: true
        }
      });

      if (response.success) {
        const updatedRequest = {
          ...propertyRequest,
          status: 'awaiting_admin_approval',
          adminApproval: 'pending',
          stepCompletion: [true, true, true, true, true, true, true]
        };

        setPropertyRequest(updatedRequest);
        localStorage.setItem(`property_request_${user.id}`, JSON.stringify(updatedRequest));

        setCompletedSteps(prev => {
          const updated = { ...prev, 7: true };
          localStorage.setItem('completed_steps', JSON.stringify(updated));
          return updated;
        });

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
      if (activeStep === 3 && isVerificationInProgress && verificationStatus?.status !== 'verified') {
        toast.error("Please wait for verification to complete before submitting property details");
        setShowVerificationRestriction(true);
        return;
      }
      setActiveStep(activeStep + 1);
    }
  };

  const handleManualVerificationCheck = async () => {
    try {
      setIsLoading(true);
      toast.loading('Checking verification status...', { id: 'verification-check' });

      const result = await checkVerificationStatus(true);

      if (result) {
        toast.success('Status checked!', { id: 'verification-check' });

        if (result.status === 'verified') {
          toast.success('✅ Verification complete! You can now submit property details.');
        } else if (result.status === 'needs_resubmission') {
          toast.error('🔄 Please resubmit your documents', {
            description: result.feedback,
            duration: 6000
          });
        }
      }
    } catch (error) {
      toast.error('Error checking status', { id: 'verification-check' });
      console.error('Manual check error:', error);
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
          description: "Get the best price for your property with our market analysis and professional pricing strategy.",
          highlight: "Optimal Pricing",
          action: () => {
            if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
              toast.error("Please wait for verification to complete before submitting property details");
              return;
            }
            setActiveStep(3);
          }
        },
        {
          id: 1,
          icon: ShieldCheck,
          title: "Secure Transactions",
          description: "End-to-end verification process ensuring legal compliance and secure property transfers.",
          highlight: "Risk-Free",
          action: () => {
            if (hasSubmittedDocuments && isVerificationInProgress) {
              setShowVerificationRestriction(true);
              toast.error("Please wait for verification to complete before uploading new documents");
            } else {
              setShowDocumentUpload(true);
            }
          }
        },
        {
          id: 2,
          icon: Globe,
          title: "Maximum Exposure",
          description: "Your property listed across 15+ platforms with professional photography and virtual tours.",
          highlight: "Wide Reach",
          action: () => {
            if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
              toast.error("Please wait for verification to complete before submitting property details");
              return;
            }
            setActiveStep(3);
          }
        },
        {
          id: 3,
          icon: Handshake,
          title: "Expert Guidance",
          description: "Connect with certified Ethiopian brokers offering local expertise and market knowledge.",
          highlight: "Local Partners",
          action: () => brokers.length > 0 && setShowChat(true)
        }
      ],
      leaser: [
        {
          id: 0,
          icon: Shield,
          title: "Safe & Secure",
          description: "Verified tenants with secure payments and legally binding rental agreements.",
          highlight: "Peace of Mind",
          action: () => {
            if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
              toast.error("Please wait for verification to complete before submitting property details");
              return;
            }
            setActiveStep(3);
          }
        },
        {
          id: 1,
          icon: Users,
          title: "Quality Tenants",
          description: "Our verification process ensures reliable and responsible tenants for your property.",
          highlight: "Verified Tenants",
          action: () => {
            if (hasSubmittedDocuments && isVerificationInProgress) {
              setShowVerificationRestriction(true);
              toast.error("Please wait for verification to complete before uploading new documents");
            } else {
              setShowDocumentUpload(true);
            }
          }
        },
        {
          id: 2,
          icon: DollarSign,
          title: "Optimize Income",
          description: "Market-based rental pricing to maximize your monthly income while remaining competitive.",
          highlight: "Best Returns",
          action: () => {
            if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
              toast.error("Please wait for verification to complete before submitting property details");
              return;
            }
            setActiveStep(3);
          }
        },
        {
          id: 3,
          icon: FileCheck,
          title: "Digital Process",
          description: "Streamlined digital documentation and contract management for hassle-free renting.",
          highlight: "Paperless",
          action: () => {
            if (hasSubmittedDocuments && isVerificationInProgress) {
              setShowVerificationRestriction(true);
              toast.error("Please wait for verification to complete before uploading new documents");
            } else {
              setShowDocumentUpload(true);
            }
          }
        }
      ]
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
          time: "10-15 mins"
        },
        {
          step: 2,
          title: "Choose Broker",
          description: "Select your preferred certified real estate broker.",
          icon: Users,
          time: "1-2 Days"
        },
        {
          step: 3,
          title: "Schedule Inspection",
          description: "Book property inspection with assigned broker.",
          icon: Calendar,
          time: "2-5 Days"
        },
        {
          step: 4,
          title: "Property Inspection",
          description: "Broker conducts detailed property verification.",
          icon: ShieldCheck,
          time: "1-2 Days"
        },
        {
          step: 5,
          title: "Listing Proposal",
          description: "Review and approve listing details.",
          icon: FileText,
          time: "1-2 Days"
        },
        {
          step: 6,
          title: "Admin Approval",
          description: "Final listing review by admin team.",
          icon: CheckCircle,
          time: "24-48 Hours"
        },
        {
          step: 7,
          title: "Contract & Payment",
          description: "Sign contracts and complete payment.",
          icon: Handshake,
          time: "1-3 Days"
        }
      ],
      leaser: [
        {
          step: 1,
          title: "Property Details",
          description: "Tell us about your rental property.",
          icon: Home,
          time: "10-15 mins"
        },
        {
          step: 2,
          title: "Choose Broker",
          description: "Select rental management specialist.",
          icon: Users,
          time: "1-2 Days"
        },
        {
          step: 3,
          title: "Schedule Inspection",
          description: "Book property assessment with broker.",
          icon: Calendar,
          time: "2-5 Days"
        },
        {
          step: 4,
          title: "Property Inspection",
          description: "Broker verifies property condition.",
          icon: ShieldCheck,
          time: "1-2 Days"
        },
        {
          step: 5,
          title: "Listing Proposal",
          description: "Review rental listing details.",
          icon: FileText,
          time: "1-2 Days"
        },
        {
          step: 6,
          title: "Admin Approval",
          description: "Final approval by admin team.",
          icon: CheckCircle,
          time: "24-48 Hours"
        },
        {
          step: 7,
          title: "Lease Agreement",
          description: "Sign rental contract with tenant.",
          icon: Handshake,
          time: "1-3 Days"
        }
      ]
    };
    return baseJourneys[userType];
  };

  const handleOpenChatWithBroker = (broker) => {
    setSelectedBroker(broker);
    setShowChat(true);
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
      <div className="relative flex flex-col items-center cursor-pointer transition-all duration-500 group" onClick={() => onClick(step.number)}>

        {step.number > 1 && (
          <div className={`absolute -left-16 top-6 w-16 h-0.5 transition-all duration-500 ${isCompleted || isActive
            ? `bg-gradient-to-r ${step.color}`
            : "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 group-hover:from-amber-400 group-hover:to-amber-500"
            }`} />
        )}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl ${isCompleted
          ? `bg-gradient-to-r ${step.color} border-transparent text-white shadow-lg`
          : isActive
            ? `border-transparent bg-gradient-to-r ${step.color} text-white shadow-lg`
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 group-hover:border-amber-400"
          }`}>
          {isCompleted ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <IconComponent className={`w-10 h-10 ${isActive ? 'text-white' : step.iconColor} group-hover:text-amber-500`} />
          )}
        </div>
        <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 shadow-lg ${isCompleted || isActive
          ? `bg-gradient-to-r ${step.color} text-white`
          : "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white"
          }`}>
          {step.number}
        </div>
        <div className="mt-6 text-center max-w-[140px]">
          <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${isActive || isCompleted
            ? `bg-gradient-to-r ${step.color} bg-clip-text text-transparent`
            : "text-gray-600 dark:text-gray-400 group-hover:text-amber-500"
            }`}>
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
    const isUploadDisabled = hasSubmittedDocuments && isVerificationInProgress && verificationStatus?.status !== 'needs_resubmission';

    const getVerificationGradient = () => {
      if (verificationStatus?.status === 'needs_resubmission') {
        return 'bg-gradient-to-r from-amber-500 to-amber-800';
      } else if (isUploadDisabled) {
        return 'bg-gradient-to-r from-gray-500 to-gray-700';
      } else {
        return 'bg-gradient-to-r from-amber-500 to-amber-800';
      }
    };

    const getVerificationIcon = () => {
      if (verificationStatus?.status === 'needs_resubmission') {
        return <AlertCircle className={`w-16 h-16 ${theme === "dark" ? "text-amber-200" : "text-amber-500"}`} />;
      } else if (isUploadDisabled) {
        return <Lock className={`w-16 h-16 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />;
      } else {
        return <ShieldCheck className={`w-16 h-16 ${theme === "dark" ? "text-amber-200" : "text-amber-500"}`} />;
      }
    };

    const getVerificationTitle = () => {
      if (verificationStatus?.status === 'needs_resubmission') {
        return 'Resubmission Required';
      } else if (isUploadDisabled) {
        return 'Verification In Progress';
      } else {
        return hasSubmittedDocuments ? 'Complete Your Verification' : 'Verify Your Identity';
      }
    };

    const getVerificationDescription = () => {
      if (verificationStatus?.status === 'needs_resubmission') {
        return 'Your documents need corrections. Please review the feedback and upload the corrected versions.';
      } else if (isUploadDisabled) {
        return 'Your documents are currently being reviewed. Please wait for the verification process to complete before uploading new documents.';
      } else {
        return hasSubmittedDocuments
          ? 'Upload additional documents or check your verification status to complete the process.'
          : 'Upload required documents to verify your identity and unlock full access to list your property.';
      }
    };

    const getVerificationSteps = () => {
      if (verificationStatus?.status === 'needs_resubmission') {
        return [
          {
            icon: <FileText className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: 'Review Feedback'
          },
          {
            icon: <Upload className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: 'Upload Corrections'
          },
          {
            icon: <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: 'Complete Verification'
          }
        ];
      } else if (isUploadDisabled) {
        return [
          {
            icon: <Clock className="w-8 h-8 mx-auto mb-2 text-gray-500" />,
            title: 'Under Review',
            bgColorDark: 'bg-gray-800/50 border border-gray-700',
            bgColorLight: 'bg-gray-100 border border-gray-300'
          },
          {
            icon: <FileCheck className="w-8 h-8 mx-auto mb-2 text-gray-500" />,
            title: 'Processing',
            bgColorDark: 'bg-gray-800/50 border border-gray-700',
            bgColorLight: 'bg-gray-100 border border-gray-300'
          },
          {
            icon: <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-gray-500" />,
            title: 'Pending Approval',
            bgColorDark: 'bg-gray-800/50 border border-gray-700',
            bgColorLight: 'bg-gray-100 border border-gray-300'
          }
        ];
      } else {
        return [
          {
            icon: <FileText className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: 'Upload Documents'
          },
          {
            icon: <Shield className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: 'Secure Processing'
          },
          {
            icon: <CheckCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />,
            title: 'Get Verified'
          }
        ];
      }
    };

    const getVerificationButtonStyles = () => {
      if (verificationStatus?.status === 'needs_resubmission') {
        return 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:text-white';
      } else if (isUploadDisabled) {
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
      } else {
        return 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:text-white';
      }
    };

    const getVerificationMainAction = () => {
      if (verificationStatus?.status === 'needs_resubmission') {
        return () => {
          setShowDocumentUpload(true);
          toast('Please upload corrected documents as requested', { icon: '📄' });
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
      if (verificationStatus?.status === 'needs_resubmission') {
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
            {hasSubmittedDocuments ? 'Upload Additional Documents' : 'Upload Required Documents'}
          </>
        );
      }
    };

    return (
      <div className="text-center py-8">
        <div className="relative mx-auto w-36 h-36 mb-8">
          <div className={`absolute inset-0 ${getVerificationGradient()} rounded-full ${verificationStatus?.status === 'needs_resubmission' ? 'animate-pulse' : ''}`}></div>
          <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
            {getVerificationIcon()}
          </div>
        </div>

        <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
          {getVerificationTitle()}
        </h4>

        <div className="max-w-2xl mx-auto mb-10">
          <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            {getVerificationDescription()}
          </p>

          <div className={`p-6 rounded-xl mb-6 ${theme === "dark"
            ? "bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/30"
            : "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${verificationStatus?.status === 'verified' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                verificationStatus?.status === 'needs_resubmission' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                  'bg-gradient-to-r from-amber-500 to-amber-600'
                }`}>
                {verificationStatus?.status === 'verified' ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : verificationStatus?.status === 'needs_resubmission' ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h5 className={`font-semibold text-lg mb-2 ${theme === "dark" ? "text-amber-300" : "text-amber-700"}`}>
                  {getVerificationStepTitle()}
                </h5>
                <p className={`text-sm ${theme === "dark" ? "text-amber-400/80" : "text-amber-600/80"}`}>
                  {getVerificationStepDescription()}
                </p>
                {verificationStatus?.feedback && (
                  <div className="mt-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Admin Feedback:</span> {verificationStatus.feedback}
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
                className={`p-4 rounded-xl text-center ${theme === "dark"
                  ? step.bgColorDark || "bg-gray-800/50 border border-gray-700"
                  : step.bgColorLight || "bg-amber-50 border border-amber-200"
                  }`}
              >
                {step.icon}
                <p className="font-medium">{step.title}</p>
              </div>
            ))}
          </div>

          {isVerificationInProgress && (
            <div className={`p-6 rounded-xl mb-6 ${theme === "dark"
              ? "bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-800/30"
              : "bg-gradient-to-r from-blue-50 to-cyan-50/50 border border-blue-200"}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className={`font-semibold text-lg mb-3 ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                    Verification Status
                  </h5>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                        <span className="text-xs font-bold">1</span>
                      </div>
                      <span className={`text-sm ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                        Status: {verificationStatus?.status || 'Pending'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                        <span className="text-xs font-bold">2</span>
                      </div>
                      <span className={`text-sm ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                        Last checked: {lastVerificationCheck ? new Date(lastVerificationCheck).toLocaleTimeString() : 'Never'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                        <span className="text-xs font-bold">3</span>
                      </div>
                      <span className={`text-sm ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                        {isUploadDisabled ? 'Uploads disabled during review' : 'You can upload documents'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isUploadDisabled && (
            <div className={`p-4 rounded-lg ${theme === "dark"
              ? "bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-800/30"
              : "bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200"}`}>
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className={`text-sm ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
                  <span className="font-medium">Security Feature:</span> {getVerificationStepDescription()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={getVerificationMainAction()}
            disabled={isUploadDisabled}
            className={`px-10 py-4 font-semibold Button2 ${getVerificationButtonStyles()} ${isUploadDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
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

        {isVerificationInProgress && verificationStatus?.status !== 'verified' && (
          <div className={`text-center mt-4 p-4 rounded-lg ${theme === "dark" ? "bg-amber-900/20 border border-amber-800/30" : "bg-amber-50 border border-amber-200"}`}>
            <div className="flex items-center justify-center gap-3">
              <AlertCircle className={`w-5 h-5 ${theme === "dark" ? "text-amber-400" : "text-amber-500"}`} />
              <p className={`font-medium ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
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
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme === "dark" ? "bg-black/70" : "bg-black/50"}`}>
        <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl ${theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-amber-500/30"
          : "bg-gradient-to-br from-white via-amber-50 to-white border border-amber-200"
          }`}>
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                <Lock className="w-12 h-12 text-amber-500 animate-pulse" />
              </div>
            </div>

            <h2 className={`text-2xl md:text-3xl font-bold text-center mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Verification in Progress
            </h2>

            <div className={`p-6 rounded-xl mb-6 ${theme === "dark"
              ? "bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700/30"
              : "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
              }`}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg mb-2 ${theme === "dark" ? "text-amber-300" : "text-amber-700"}`}>
                    {getVerificationStepTitle()}
                  </h3>
                  <p className={`text-sm ${theme === "dark" ? "text-amber-400/80" : "text-amber-600/80"}`}>
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
                  <h4 className={`font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                    Security Check
                  </h4>
                  <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Our team is verifying your documents to ensure authenticity and prevent fraud.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
                <div>
                  <h4 className={`font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                    Manual Review Process
                  </h4>
                  <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Each document is manually reviewed by our Ethiopian verification specialists.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
                <div>
                  <h4 className={`font-medium ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                    {verificationStatus?.status === 'needs_resubmission' ? 'Resubmission Required' : 'No New Uploads Allowed'}
                  </h4>
                  <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {verificationStatus?.status === 'needs_resubmission'
                      ? 'Please resubmit corrected documents as requested by our team.'
                      : 'You cannot upload new documents while verification is in progress to prevent confusion.'}
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
                  if (verificationStatus?.status === 'needs_resubmission') {
                    setShowDocumentUpload(true);
                  } else {
                    handleManualVerificationCheck();
                  }
                }}
                className="flex-1 py-3 font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all duration-300"
              >
                {verificationStatus?.status === 'needs_resubmission' ? 'Resubmit Documents' : 'Check Status'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InformationCenter = () => {
    const currentCard = infoCards[activeInfoCard];
    const isSeller = userType === 'seller';

    return (
      <div className="mb-16">
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-3 mb-4 px-6 py-3 rounded-full ${theme === "dark"
            ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
            : "bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200"
            }`}>
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-semibold text-amber-600">
              {isSeller ? "Property Selling Journey" : "Rental Management Journey"}
            </span>
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>

          <h2 className={`text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r ${isSeller
            ? "from-amber-500 to-amber-700"
            : "from-amber-700 to-amber-500"
            } bg-clip-text text-transparent`}>
            {isSeller ? "Sell Your Property with Confidence" : "Rent Out Your Property Securely"}
          </h2>

          <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
            {isSeller
              ? "Navigate Ethiopia's real estate market with expert brokers, secure transactions, and maximum exposure for your property."
              : "Find reliable tenants, optimize your rental income, and manage your property effortlessly with professional support."
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div
            className={`relative overflow-hidden p-8 transition-all duration-500 hover:scale-[1.02] cursor-pointer group ${theme === "dark"
              ? "bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-amber-500/20"
              : "bg-gradient-to-br from-white via-amber-50 to-white border border-amber-200 shadow-xl"
              }`}
            onClick={currentCard.action}
            onMouseEnter={() => setHoveredCard('featured')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-full mb-6 backdrop-blur-sm ${theme === "dark"
                  ? "bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-700/30"
                  : "bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200"
                  }`}>
                  <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
                    <currentCard.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {currentCard.highlight}
                  </span>
                </div>
                <h3 className={`text-3xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {currentCard.title}
                </h3>
                <p className={`text-lg mb-6 leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
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
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${activeInfoCard === idx
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
                    src={isSeller ? "/vectors/SellHouse.svg" : "/vectors/RentHouse.svg"}
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
              .filter(card => card.id !== activeInfoCard)
              .map((card) => (
                <div
                  key={card.id}
                  className={`p-6 rounded-2xl transition-all duration-300 hover:scale-[1.03] cursor-pointer group relative overflow-hidden ${theme === "dark"
                    ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:from-gray-700/80 hover:to-gray-800/80 border border-gray-700"
                    : "bg-gradient-to-br from-white to-gray-50 hover:from-amber-50 hover:to-orange-50 border border-gray-200 shadow-lg"
                    } ${hoveredCard === card.id ? 'ring-2 ring-amber-400 ' : ''}`}
                  onClick={card.action}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-orange-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                  <div className="relative flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${theme === "dark"
                      ? "bg-gradient-to-br from-amber-900/30 to-orange-900/30"
                      : "bg-gradient-to-br from-amber-100 to-orange-100"
                      }`}>
                      <card.icon className={`w-7 h-7 ${theme === "dark" ? "text-amber-400" : "text-amber-600"
                        } group-hover:scale-110 transition-transform`} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-lg mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                        {card.title}
                      </h4>
                      <p className={`text-sm font-medium ${theme === "dark" ? "text-amber-300" : "text-amber-600"
                        }`}>
                        {card.highlight}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm relative ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }  transition-colors`}>
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
            <h3 className={`text-3xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
              Your <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                {isSeller ? 'Selling' : 'Rental'} Journey
              </span>
            </h3>
            <p className={`text-lg max-w-2xl mx-auto ${theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}>
              Follow these simple steps to {isSeller ? 'sell' : 'rent out'} your property in Ethiopia
            </p>
          </div>
          <div className="relative">
            <div className={`absolute left-0 right=0 top-12 h-1 ${theme === "dark" ? "bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700" : "bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300"
              } overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-[shimmer_2s_infinite]"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {journeySteps.map((step, index) => (
                <div key={step.step} className="relative">
                  <div className={`absolute z-20 -top-6 left-8 w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg ${hoveredCard === `step-${step.step}`
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    } text-white transition-all duration-300`}>
                    {step.step}
                  </div>
                  <div
                    className={`p-10 transition-all duration-500 hover:scale-[1.05] cursor-pointer group relative overflow-hidden ${theme === "dark"
                      ? "bg-gradient-to-br from-gray-800/60 to-gray-900/60 hover:from-gray-700/80 hover:to-gray-800/80 border border-gray-700/50"
                      : "bg-gradient-to-br from-white to-gray-50 hover:from-amber-50 hover:to-orange-50 border border-gray-200 shadow-xl"
                      }`}
                    onMouseEnter={() => setHoveredCard(`step-${step.step}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-4 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${theme === "dark"
                        ? "bg-gradient-to-br from-amber-900/30 to-orange-900/30"
                        : "bg-gradient-to-br from-amber-100 to-orange-100"
                        }`}>
                        <step.icon className={`w-8 h-8 ${theme === "dark" ? "text-amber-400" : "text-amber-600"
                          } group-hover:text-orange-500 transition-colors`} />
                      </div>
                      <div>
                        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${theme === "dark"
                          ? "bg-gray-700 text-gray-300 group-hover:bg-amber-500 group-hover:text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-amber-500 group-hover:text-white"
                          } transition-all duration-300`}>
                          {step.time}
                        </span>
                      </div>
                    </div>
                    <h4 className={`text-xl font-bold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"
                      } group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-orange-600 group-hover:bg-clip-text group-hover:text-transparent`}>
                      {step.title}
                    </h4>
                    <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                      } transition-colors`}>
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

  // Render broker card component
  const renderBrokerCard = (broker, isCompact = false) => {
    const isSelected = selectedBroker?.id === broker.id;

    return (
      <div
        key={broker.id}
        className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:shadow-2xl ${isSelected
          ? 'border-amber-400 ring-2 ring-amber-400 ring-opacity-50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
          : theme === "dark"
            ? 'border-gray-700 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-amber-400'
            : 'border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-amber-400'
          }`}
        onClick={() => {
          setSelectedBrokerForModal(broker);
          setShowBrokerModal(true);
        }}
      >
        {/* Hover gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-orange-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-2 rounded-full shadow-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Broker header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isSelected ? 'border-amber-400' : 'border-gray-300 dark:border-gray-600'
                }`}>
                {broker.profile_picture ? (
                  <img
                    src={broker.profile_picture}
                    alt={broker.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              {/* Online status indicator */}
              {broker.is_available && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              )}
            </div>

            {/* Broker info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {broker.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {broker.brokerage_firm || 'Independent Broker'}
                  </p>
                </div>

                {/* Rating badge */}
                <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold">{broker.average_rating?.toFixed(1) || '4.5'}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${theme === "dark"
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
                  }`}>
                  {broker.experience_years || '5'} years
                </span>
                {broker.specialization?.[0] && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${theme === "dark"
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-blue-100 text-blue-700'
                    }`}>
                    {broker.specialization[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isCompact && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {broker.total_completed_deals || '50'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Deals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {broker.commission_rate || '2.5%'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Commission</div>
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${broker.is_available
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                    {broker.is_available ? 'Available' : 'Busy'}
                  </div>
                </div>
              </div>

              {/* Action button */}
              <button
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 group relative overflow-hidden ${isSelected
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrokerSelect(broker);
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSelected ? 'Selected ✓' : 'View Profile'}
                  {!isSelected && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // ========== RENDER FUNCTIONS ==========

  const renderStepContent = () => {
    const renderError = (field) => formErrors[field] && (
      <p className="text-red-500 text-sm mt-1">{formErrors[field]}</p>
    );

    const renderFormField = (label, field, type = "text", options = [], placeholder = "") => (
      <div>
        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
          {label}
        </label>
        {type === "select" ? (
          <select
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white hover:border-amber-400" : "bg-white border-gray-300 text-gray-900 hover:border-amber-400"
              } ${formErrors[field] ? "border-red-500" : ""}`}
          >
            <option value="">{placeholder}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
              } ${formErrors[field] ? "border-red-500" : ""}`}
          />
        )}
        {renderError(field)}
      </div>
    );

    const isStepCompleted = (stepNumber) => {
      switch (stepNumber) {
        case 1:
          return formData.property_type && formData.location && formData.price;
        case 2:
          return !!propertyRequest.brokerId;
        case 3:
          return !!propertyRequest.verificationDate;
        case 4:
          return propertyRequest.inspectionStatus === 'completed';
        case 5:
          return !!propertyRequest.listingProposal;
        case 6:
          return propertyRequest.adminApproval === 'approved';
        case 7:
          return propertyRequest.status === 'completed';
        default:
          return false;
      }
    };

    switch (activeStep) {
      case 1: // Property Details
        const step1Completed = isStepCompleted(1);

        // Helper function to handle multiple image uploads
        const handleMultipleImageUpload = (e) => {
          const files = Array.from(e.target.files);

          // Validate each file
          const validFiles = files.filter(file => {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!validTypes.includes(file.type)) {
              toast.error(`Invalid file type for ${file.name}. Please upload JPEG, JPG, PNG, or WebP.`);
              return false;
            }
            if (file.size > maxSize) {
              toast.error(`${file.name} is too large. Maximum size is 10MB.`);
              return false;
            }
            return true;
          });

          // Limit to 3 images
          const filesToProcess = validFiles.slice(0, 3 - propertyImages.length);

          if (filesToProcess.length === 0) return;

          // Create previews for each image
          filesToProcess.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreviews(prev => [...prev, { url: reader.result, type: '' }]);
            };
            reader.readAsDataURL(file);
          });

          // Add to form data
          setPropertyImages(prev => [...prev, ...filesToProcess]);
          setFormData(prev => ({
            ...prev,
            property_images: [...prev.property_images || [], ...filesToProcess]
          }));

          if (formErrors.property_images) {
            setFormErrors(prev => ({ ...prev, property_images: undefined }));
          }
        };

        // Helper function to remove specific image
        const handleRemoveSpecificImage = (index) => {
          setImagePreviews(prev => prev.filter((_, i) => i !== index));
          setPropertyImages(prev => prev.filter((_, i) => i !== index));
          setFormData(prev => ({
            ...prev,
            property_images: prev.property_images?.filter((_, i) => i !== index) || []
          }));
        };

        // Helper function to set image type
        const handleSetImageType = (index, type) => {
          const updatedPreviews = [...imagePreviews];
          updatedPreviews[index] = { ...updatedPreviews[index], type };
          setImagePreviews(updatedPreviews);
          setFormData(prev => ({
            ...prev,
            property_images: prev.property_images?.map((img, i) =>
              i === index ? { ...img, type } : img
            ) || []
          }));
        };

        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <h4 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                {step1Completed ? "Property Details Submitted" : "Tell Us About Your Property"}
              </h4>
              <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                {step1Completed
                  ? "Your property details have been submitted successfully."
                  : "Provide detailed information about your property to get started."
                }
              </p>
            </div>

            {!step1Completed ? (
              <div className={`p-8 rounded-xl border-2 ${theme === "dark" ? "bg-gray-800/50 border-amber-400/30" : "bg-white border-amber-200"} backdrop-blur-sm`}>
                {/* Multiple Image Upload Section */}
                <div className="mb-8">
                  <label className={`block text-sm font-medium mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Upload Property Photos (Required: Outside, Living Room, Kitchen) *
                  </label>

                  {imagePreviews.length < 3 ? (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${theme === "dark"
                        ? "border-gray-600 hover:border-amber-400 bg-gray-700/30"
                        : "border-gray-300 hover:border-amber-400 bg-gray-50"
                        } ${formErrors.property_images ? "border-red-500" : ""}`}
                      onClick={() => document.getElementById('property-images-upload')?.click()}
                    >
                      <div className="space-y-4">
                        <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                          <Camera className="w-10 h-10 text-amber-600" />
                        </div>
                        <div>
                          <p className={`font-medium mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            Upload {3 - imagePreviews.length} more photo{3 - imagePreviews.length === 1 ? '' : 's'}
                          </p>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            Required: Outside view, Living room, Kitchen • Max 10MB each • JPG, PNG, WebP
                          </p>
                          <div className="mt-4 flex flex-wrap justify-center gap-4">
                            {['Outside View', 'Living Room', 'Kitchen'].map((type, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${imagePreviews.some(img => img.type === type.toLowerCase().replace(' ', '_'))
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                                  }`}>
                                  {imagePreviews.some(img => img.type === type.toLowerCase().replace(' ', '_')) ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <span className="text-xs">{idx + 1}</span>
                                  )}
                                </div>
                                <span className="text-xs">{type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <input
                        id="property-images-upload"
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleMultipleImageUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className={`p-4 rounded-xl ${theme === "dark"
                      ? "bg-green-900/20 border border-green-700"
                      : "bg-green-50 border border-green-200"
                      }`}>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <p className="font-medium text-green-600">All required photos uploaded!</p>
                      </div>
                    </div>
                  )}

                  {renderError("property_images")}
                </div>

                {/* Image Preview Grid */}
                {imagePreviews.length > 0 && (
                  <div className="mb-8">
                    <h5 className={`text-sm font-medium mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Uploaded Photos ({imagePreviews.length}/3)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="relative overflow-hidden rounded-lg">
                            <img
                              src={preview.url}
                              alt={`Property photo ${index + 1}`}
                              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecificImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            {/* Image type selector */}
                            {!preview.type && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3">
                                <p className="text-white text-sm mb-2 text-center">Select photo type:</p>
                                <div className="flex gap-2">
                                  {['outside_view', 'living_room', 'kitchen'].map((type) => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => handleSetImageType(index, type)}
                                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs py-1.5 rounded transition-colors"
                                    >
                                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Image type badge */}
                            {preview.type && (
                              <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium ${theme === "dark"
                                ? "bg-amber-900 text-amber-100"
                                : "bg-amber-100 text-amber-800"
                                }`}>
                                {preview.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            )}
                          </div>

                          {/* Image number indicator */}
                          <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${theme === "dark"
                            ? "bg-amber-600 text-white"
                            : "bg-amber-500 text-white"
                            }`}>
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add more photos button if less than 3 */}
                    {imagePreviews.length < 3 && (
                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={() => document.getElementById('property-images-upload')?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add {3 - imagePreviews.length} more photo{3 - imagePreviews.length === 1 ? '' : 's'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Property Details Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {renderFormField(
                    "Property Type *",
                    "property_type",
                    "select",
                    [
                      { value: "house", label: "House" },
                      { value: "apartment", label: "Apartment" },
                      { value: "villa", label: "Villa" },
                      { value: "condo", label: "Condo" },
                      { value: "commercial", label: "Commercial" },
                      { value: "land", label: "Land" }
                    ],
                    "Select Property Type"
                  )}

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Location *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="Enter sub-city, woreda, or specific address"
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                          } ${formErrors.location ? "border-red-500" : ""}`}
                      />
                    </div>
                    {renderError("location")}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      {formData.user_type === "seller" ? "Expected Price (ETB) *" : "Monthly Rent (ETB) *"}
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        placeholder="Enter amount in ETB"
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                          } ${formErrors.price ? "border-red-500" : ""}`}
                      />
                    </div>
                    {renderError("price")}
                  </div>

                  {renderFormField(
                    "Verification Method",
                    "verification_method",
                    "select",
                    [
                      { value: "physical", label: "Physical Visit" },
                      { value: "video", label: "Video Call" },
                      { value: "documents", label: "Document Upload" },
                      { value: "mixed", label: "Mixed (Physical + Documents)" }
                    ],
                    "Select Verification Method"
                  )}
                </div>

                {/* Additional property details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.beds}
                      onChange={(e) => handleInputChange("beds", e.target.value)}
                      placeholder="Number of bedrooms"
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                        }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.baths}
                      onChange={(e) => handleInputChange("baths", e.target.value)}
                      placeholder="Number of bathrooms"
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                        }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Area (sqm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sqft}
                      onChange={(e) => handleInputChange("sqft", e.target.value)}
                      placeholder="Property area in square meters"
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                        }`}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your property (features, amenities, nearby facilities, etc.)"
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                      }`}
                  />
                </div>

                {/* Validation for images */}
                {formErrors.property_images && (
                  <div className={`p-4 rounded-lg mb-6 ${theme === "dark"
                    ? "bg-red-900/20 border border-red-700 text-red-300"
                    : "bg-red-50 border border-red-200 text-red-700"
                    }`}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      <p className="font-medium">{formErrors.property_images}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmitPropertyRequest}
                  disabled={isLoading || imagePreviews.length < 3}
                  className={`w-full font-bold py-4 px-6 rounded-lg transition-all duration-300 ${imagePreviews.length < 3
                    ? "bg-gray-400 cursor-not-allowed text-gray-600"
                    : "bg-amber-400 hover:bg-amber-500 text-black"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? "Submitting..." : `Submit Property Details (${imagePreviews.length}/3 photos)`}
                </button>
              </div>
            ) : (
              // Success state remains the same
              <div className="text-center py-8">
                <div className="relative mx-auto w-36 h-36 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                  <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                </div>
                <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                  Property Details Submitted
                </h4>
                <div className="max-w-2xl mx-auto mb-10">
                  <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Your property details have been submitted successfully. You can now proceed to select a broker.
                  </p>
                  <div className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <Home className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold">Property Details Complete</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                      <div>
                        <p className="text-sm font-medium">Property Type</p>
                        <p className="text-lg font-bold">{formData.property_type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-lg font-bold">{formData.location}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Price</p>
                        <p className="text-lg font-bold">{formatCurrency(formData.price)}</p>
                      </div>
                    </div>
                    {/* Show uploaded images in success state */}
                    {imagePreviews.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium mb-2">Uploaded Photos:</p>
                        <div className="flex gap-2">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="w-16 h-16 rounded overflow-hidden">
                              <img
                                src={preview.url}
                                alt={`Property ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleContinueStep}
                  className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  Continue to Broker Selection
                </button>
              </div>
            )}
          </div>
        );

      case 2: // Choose Broker - Simple Version
        const step2Completed = isStepCompleted(2);

        // Simple render function for broker cards
        const renderBrokerCard = (broker, isCompact = false) => {
          const isSelected = selectedBroker?.id === broker.id;
          const rating = broker.average_rating || 4.5;
          const experienceYears = broker.experience_years || 5;
          const completedDeals = broker.total_completed_deals || 50;
          const commissionRate = broker.commission_rate || '2.5%';

          return (
            <div
              key={broker.id}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : theme === "dark"
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              onClick={() => {
                setSelectedBrokerForModal(broker);
                setShowBrokerModal(true);
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="flex justify-end mb-2">
                  <div className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">
                    Selected
                  </div>
                </div>
              )}

              {/* Broker header */}
              <div className="flex items-start gap-3 mb-4">
                {/* Avatar */}
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full overflow-hidden ${theme === "dark" ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                    {broker.profile_picture ? (
                      <img
                        src={broker.profile_picture}
                        alt={broker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-7 h-7 text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Broker info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate ${theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                        {broker.name || "Unknown Broker"}
                      </h3>
                      <p className={`text-sm truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}>
                        {broker.brokerage_firm || 'Independent Broker'}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded ${theme === "dark" ? "bg-amber-900/50" : "bg-amber-100"
                      }`}>
                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                      <span className={`text-sm font-medium ${theme === "dark" ? "text-amber-300" : "text-amber-700"
                        }`}>
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                      }`}>
                      {experienceYears} years
                    </span>
                    {broker.specialization?.[0] && (
                      <span className={`text-xs px-2 py-1 rounded ${theme === "dark" ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"
                        }`}>
                        {broker.specialization[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isCompact && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`p-3 rounded-lg text-center ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}>
                      <div className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                        {completedDeals}+
                      </div>
                      <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}>
                        Deals
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}>
                      <div className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                        {commissionRate}
                      </div>
                      <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}>
                        Commission
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${isSelected
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrokerSelect(broker);
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                    <button
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${theme === "dark"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBrokerForModal(broker);
                        setShowBrokerModal(true);
                      }}
                    >
                      View
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        };

        return (
          <div className={`py-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          
            {/* Header */}
            <div className={`p-6 text-center mb-6 `}>
              <h3 className={`text-2xl font-bold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                {step2Completed ? "Broker Selected" : "Choose Your Broker"}
              </h3>
              <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                {step2Completed
                  ? `You've selected ${propertyRequest.brokerName} as your broker.`
                  : "Select a real estate broker to guide you through the listing process."
                }
              </p>
            </div>

            {!step2Completed ? (
              <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
                }`}>
                {/* Search and Filter */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-500" : "text-gray-400"
                        }`} />
                      <input
                        type="text"
                        placeholder="Search brokers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme === "dark"
                          ? "bg-gray-900 border-gray-600 text-white placeholder-gray-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          }`}
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`px-4 py-3 rounded-lg border ${theme === "dark"
                        ? "bg-gray-900 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                        }`}
                    >
                      <option value="rating">Sort by Rating</option>
                      <option value="experience">Sort by Experience</option>
                      <option value="deals">Sort by Deals</option>
                      <option value="commission">Sort by Commission</option>
                    </select>
                  </div>
                </div>

                {/* Brokers Grid */}
                <div className="mb-6">
                  <h4 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                    Available Brokers {filteredBrokers.length > 0 && `(${filteredBrokers.length})`}
                  </h4>

                  {filteredBrokers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredBrokers.slice(0, 6).map((broker) => renderBrokerCard(broker, true))}
                    </div>
                  ) : (
                    <div className={`p-8 rounded-xl border text-center ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-300"
                      }`}>
                      <Users className={`w-12 h-12 mx-auto mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-400"
                        }`} />
                      <h5 className={`text-lg font-medium mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                        No Brokers Found
                      </h5>
                      <p className={`mb-4 ${theme === "dark" ? "text-gray-500" : "text-gray-600"
                        }`}>
                        Try adjusting your search criteria
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSortBy('rating');
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === "dark"
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          }`}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Top Rated Broker */}
                {filteredBrokers.length > 0 && filteredBrokers[0].average_rating >= 4.5 && (
                  <div className="mb-6">
                    <div className={`p-4 rounded-lg mb-3 ${theme === "dark" ? "bg-amber-900/30" : "bg-amber-50"
                      }`}>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h5 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                          Top-Rated Broker
                        </h5>
                      </div>
                    </div>
                    {renderBrokerCard(filteredBrokers[0])}
                  </div>
                )}

                {/* Selection Confirmation */}
                {selectedBroker && (
                  <div className={`p-4 rounded-xl border mb-6 ${theme === "dark"
                    ? "bg-green-900/20 border-green-700"
                    : "bg-green-50 border-green-300"
                    }`}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <h6 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                            Ready to confirm selection?
                          </h6>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                            }`}>
                            Selected: <span className="font-medium">{selectedBroker.name}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedBrokerForModal(selectedBroker);
                            setShowBrokerModal(true);
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === "dark"
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                        >
                          View Details
                        </button>
                        <button
                          onClick={handleConfirmBrokerSelection}
                          disabled={isLoading}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === "dark"
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-green-500 text-white hover:bg-green-600"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isLoading ? 'Assigning...' : 'Confirm Selection'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Help Text */}
                <div className={`p-4 rounded-xl border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-gray-50 border-gray-300"
                  }`}>
                  <div className="flex items-start gap-3">
                    <HelpCircle className={`w-5 h-5 mt-0.5 ${theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`} />
                    <div>
                      <h6 className={`font-medium mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>
                        Need help choosing?
                      </h6>
                      <ul className={`text-sm space-y-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}>
                        <li>• Look for high ratings (4.0+)</li>
                        <li>• Check relevant experience</li>
                        <li>• Review completed deals</li>
                        <li>• Consider specialization</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Success State
              <div className={`p-6 rounded-xl border text-center ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
                }`}>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${theme === "dark" ? "bg-green-900/30" : "bg-green-100"
                  }`}>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>

                <h4 className={`text-2xl font-bold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                  Broker Assigned Successfully
                </h4>

                <div className="max-w-2xl mx-auto mb-6">
                  <p className={`mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Your broker <span className={`font-semibold ${theme === "dark" ? "text-amber-300" : "text-amber-600"
                      }`}>{propertyRequest.brokerName}</span> has been assigned to handle your property listing.
                  </p>

                  <div className={`p-6 rounded-xl border mb-4 ${theme === "dark"
                    ? "bg-gray-900 border-gray-700"
                    : "bg-gray-50 border-gray-300"
                    }`}>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-full overflow-hidden ${theme === "dark" ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                            {selectedBroker?.profile_picture ? (
                              <img
                                src={selectedBroker.profile_picture}
                                alt={selectedBroker.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="w-8 h-8 text-gray-500" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <h5 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                            {propertyRequest.brokerName}
                          </h5>
                          <div className="flex gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${theme === "dark" ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"
                              }`}>
                              Rating: {selectedBroker?.average_rating?.toFixed(1) || '4.5'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${theme === "dark" ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
                              }`}>
                              Deals: {selectedBroker?.total_completed_deals || '50'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => setShowChat(true)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === "dark"
                            ? "bg-amber-600 text-white hover:bg-amber-700"
                            : "bg-amber-500 text-white hover:bg-amber-600"
                            }`}
                        >
                          Start Chat
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBrokerForModal(selectedBroker);
                            setShowBrokerModal(true);
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === "dark"
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>

                    <div className={`mt-4 p-3 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                      }`}>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}>
                        Your broker will contact you within 24 hours to discuss next steps.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleContinueStep}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${theme === "dark"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                  >
                    Schedule Property Inspection
                  </button>
                  <button
                    onClick={() => {
                      setActiveStep(2);
                      setSelectedBroker(null);
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${theme === "dark"
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                  >
                    Change Broker
                  </button>
                </div>
              </div>
            )}

            {/* Broker Profile Modal - REQUIRED POPUP */}
            {showBrokerModal && selectedBrokerForModal && (
              <BrokerProfileModal
                broker={selectedBrokerForModal}
                isOpen={showBrokerModal}
                onClose={() => setShowBrokerModal(false)}
                onSelect={() => {
                  handleBrokerSelect(selectedBrokerForModal);
                  setShowBrokerModal(false);
                }}
                theme={theme}
              />
            )}
          </div>
        );

      case 3: // Schedule Inspection
        const step3Completed = isStepCompleted(3);
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <h4 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                {step3Completed ? "Inspection Scheduled" : "Schedule Property Inspection"}
              </h4>
              <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                {step3Completed
                  ? "Your property inspection has been scheduled."
                  : "Book a property inspection with your assigned broker."
                }
              </p>
            </div>

            {!step3Completed ? (
              <div className={`p-8 rounded-xl border-2 ${theme === "dark" ? "bg-gray-800/50 border-amber-400/30" : "bg-white border-amber-200"} backdrop-blur-sm`}>
                <div className="mb-6">
                  <h5 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Inspection Details
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white hover:border-amber-400"
                          : "bg-white border-gray-300 text-gray-900 hover:border-amber-400"
                          }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Preferred Time *
                      </label>
                      <select className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white hover:border-amber-400"
                        : "bg-white border-gray-300 text-gray-900 hover:border-amber-400"
                        }`}>
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
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Any specific areas to focus on during inspection..."
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                        }`}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    // In a real app, you would collect form data here
                    const inspectionData = {
                      date: new Date().toISOString().split('T')[0],
                      time: '10:00',
                      notes: 'General property inspection'
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
                  <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                </div>
                <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                  Inspection Scheduled
                </h4>
                <div className="max-w-2xl mx-auto mb-10">
                  <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Your property inspection has been scheduled for {propertyRequest.verificationDate}.
                  </p>
                  <div className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <Calendar className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold">Inspection Confirmed</span>
                    </div>
                    <p className="text-sm mb-4">Your broker will contact you before the inspection.</p>
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
        const step4Completed = isStepCompleted(4);
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <h4 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                {step4Completed ? "Inspection Completed" : "Property Inspection"}
              </h4>
              <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                {step4Completed
                  ? "Your property inspection has been completed."
                  : "Complete the property inspection process."
                }
              </p>
            </div>

            {!step4Completed ? (
              <div className={`p-8 rounded-xl border-2 ${theme === "dark" ? "bg-gray-800/50 border-amber-400/30" : "bg-white border-amber-200"} backdrop-blur-sm`}>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                    <ShieldCheck className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h5 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Awaiting Inspection
                  </h5>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Your broker will conduct the inspection on {propertyRequest.verificationDate}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">Inspection Status</span>
                    </div>
                    <p className="text-sm">Scheduled - Awaiting broker completion</p>
                  </div>

                  <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">Assigned Broker</span>
                    </div>
                    <p className="text-sm">{propertyRequest.brokerName}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Simulate inspection completion
                    handleCompleteInspection({
                      status: 'completed',
                      date: new Date().toISOString(),
                      findings: 'Property in good condition',
                      recommendations: 'Ready for listing'
                    });
                  }}
                  disabled={isLoading}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Completing..." : "Mark Inspection as Complete"}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="relative mx-auto w-36 h-36 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                  <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                </div>
                <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                  Inspection Completed
                </h4>
                <div className="max-w-2xl mx-auto mb-10">
                  <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Your property inspection has been completed successfully.
                  </p>
                  <div className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <FileCheck className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold">Inspection Report Ready</span>
                    </div>
                    <p className="text-sm mb-4">Your broker will now prepare the listing proposal.</p>
                  </div>
                </div>
                <button
                  onClick={handleContinueStep}
                  className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  Review Listing Proposal
                </button>
              </div>
            )}
          </div>
        );

      case 5: // Listing Proposal
        const step5Completed = isStepCompleted(5);
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <h4 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                {step5Completed ? "Listing Proposal Ready" : "Review Listing Proposal"}
              </h4>
              <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                {step5Completed
                  ? "Your listing proposal has been prepared."
                  : "Review and approve the listing proposal from your broker."
                }
              </p>
            </div>

            {!step5Completed ? (
              <div className={`p-8 rounded-xl border-2 ${theme === "dark" ? "bg-gray-800/50 border-amber-400/30" : "bg-white border-amber-200"} backdrop-blur-sm`}>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                    <FileText className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h5 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Awaiting Broker's Proposal
                  </h5>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Your broker is preparing the listing proposal based on the inspection results.
                  </p>
                </div>

                <div className={`p-6 rounded-lg mb-6 ${theme === "dark" ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Estimated Time: 1-2 Business Days</p>
                      <p className="text-sm">Your broker will send the proposal within this timeframe</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setShowChat(true)}
                    className="w-full bg-transparent border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black font-bold py-4 px-6 rounded-lg transition-all duration-300"
                  >
                    Chat with Broker About Proposal
                  </button>
                  <button
                    onClick={() => {
                      // Simulate receiving proposal
                      setPropertyRequest(prev => ({
                        ...prev,
                        listingProposal: {
                          price: formData.price,
                          listingDescription: `Beautiful ${formData.property_type} in ${formData.location}`,
                          marketingPlan: ['Professional Photos', 'Multiple Platform Listing', 'Social Media Promotion'],
                          commission: '2.5%',
                          estimatedTime: '30-60 days'
                        }
                      }));
                      toast.success("Listing proposal received!");
                    }}
                    disabled={isLoading}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Loading..." : "Simulate Receiving Proposal"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="relative mx-auto w-36 h-36 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                  <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                </div>
                <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                  Listing Proposal Ready
                </h4>
                <div className="max-w-2xl mx-auto mb-10">
                  <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Your broker has prepared the listing proposal.
                  </p>
                  <div className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <FileText className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold">Proposal Details</span>
                    </div>
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Listing Price:</span>
                        <span className="font-bold">{formatCurrency(propertyRequest.listingProposal?.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Commission:</span>
                        <span className="font-bold">{propertyRequest.listingProposal?.commission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estimated Time:</span>
                        <span className="font-bold">{propertyRequest.listingProposal?.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleContinueStep}
                  className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  Submit for Admin Approval
                </button>
              </div>
            )}
          </div>
        );

      case 6: // Admin Approval & View Applications
        const step6Completed = isStepCompleted(6);
        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <h4 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                {step6Completed ? "Listing Approved" : "Applications & Viewings"}
              </h4>
              <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                {step6Completed
                  ? "Your listing is live! Manage applications and viewings."
                  : "Your listing is now live. Manage applications from potential buyers/renters."
                }
              </p>
            </div>

            {propertyRequest.adminApproval === 'approved' ? (
              <div className={`p-8 rounded-xl border-2 ${theme === "dark" ? "bg-gray-800/50 border-amber-400/30" : "bg-white border-amber-200"
                } backdrop-blur-sm`}>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h5 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        Property Listing Status: <span className="text-green-500">Live 🎉</span>
                      </h5>
                      <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        Your property is now listed and visible to potential buyers/renters
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${theme === "dark" ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700"
                      }`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Approved</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200"
                      }`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Views</p>
                          <p className="text-2xl font-bold">0</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">Since listing went live</p>
                    </div>

                    <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"
                      }`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Applications</p>
                          <p className="text-2xl font-bold">0</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">From interested parties</p>
                    </div>

                    <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-purple-900/20 border border-purple-700" : "bg-purple-50 border border-purple-200"
                      }`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Viewings Scheduled</p>
                          <p className="text-2xl font-bold">0</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">Property visits booked</p>
                    </div>
                  </div>

                  {/* Broker Communication */}
                  <div className={`mt-8 p-6 rounded-xl ${theme === "dark" ? "bg-amber-900/20 border border-amber-700" : "bg-amber-50 border border-amber-200"
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-6 h-6 text-amber-500" />
                        <div>
                          <h6 className="font-semibold">Need Help?</h6>
                          <p className="text-sm text-gray-500">Communicate with your broker</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (brokers.length > 0 && propertyRequest.brokerId) {
                            const broker = brokers.find(b => b.id === propertyRequest.brokerId);
                            setSelectedBroker(broker);
                            setShowChat(true);
                          }
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                      >
                        Chat with Broker
                      </button>
                    </div>
                    <p className="text-sm">
                      Your broker {propertyRequest.brokerName} can help you review applications,
                      schedule viewings, and negotiate terms.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleContinueStep}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300"
                >
                  Continue to Final Steps
                </button>
              </div>
            ) : (
              <div className={`p-8 rounded-xl border-2 ${theme === "dark" ? "bg-gray-800/50 border-amber-400/30" : "bg-white border-amber-200"
                } backdrop-blur-sm`}>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                    <CheckCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h5 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Awaiting Admin Approval
                  </h5>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Your listing is pending final review by our admin team.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200"
                    }`}>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Review Time: 24-48 Hours</p>
                        <p className="text-sm">Admin team will review your listing</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
                    }`}>
                    <h6 className="font-semibold mb-2">What happens after approval:</h6>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>Your property will be listed publicly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>Potential buyers/renters can submit applications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>You'll receive notifications for new applications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>You can schedule viewings through the system</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleApproveListing}
                    disabled={isLoading}
                    className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Submitting..." : "Submit for Admin Approval"}
                  </button>
                  <button
                    onClick={() => {
                      if (brokers.length > 0) {
                        const broker = brokers.find(b => b.id === propertyRequest.brokerId) || brokers[0];
                        setSelectedBroker(broker);
                        setShowChat(true);
                      }
                    }}
                    className="flex-1 bg-transparent border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black font-bold py-4 px-6 rounded-lg transition-all duration-300"
                  >
                    Ask Questions
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 7: // Contract & Payment / Lease Agreement
        const step7Completed = isStepCompleted(7);
        const isSeller = userType === 'seller';

        return (
          <div className="py-8">
            <div className="text-center mb-8">
              <h4 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                {step7Completed
                  ? isSeller ? "Transaction Completed" : "Lease Agreement Signed"
                  : isSeller ? "Contract & Payment" : "Lease Agreement"
                }
              </h4>
              <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                {step7Completed
                  ? isSeller
                    ? "Your property transaction has been completed successfully."
                    : "Your rental agreement has been signed and is now active."
                  : isSeller
                    ? "Complete the final transaction steps."
                    : "Review and sign the rental agreement."
                }
              </p>
            </div>

            {!step7Completed ? (
              <div className={`p-8 rounded-xl border-2 ${theme === "dark" ? "bg-gray-800/50 border-amber-400/30" : "bg-white border-amber-200"} backdrop-blur-sm`}>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                    {isSeller ? (
                      <DollarSign className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <FileText className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <h5 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {isSeller ? "Final Transaction Steps" : "Lease Agreement Ready"}
                  </h5>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {isSeller
                      ? "Complete the final steps to sell your property."
                      : "Review and sign the rental agreement with your tenant."
                    }
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{isSeller ? "Sales Contract" : "Rental Agreement"}</p>
                        <p className="text-sm">Review and sign the legal documents</p>
                      </div>
                    </div>
                  </div>

                  {isSeller && (
                    <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">Payment Processing</p>
                          <p className="text-sm">Receive payment through secure channels</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <h6 className="font-semibold mb-2">Next Steps:</h6>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>{isSeller ? "Sign sales contract" : "Sign rental agreement"}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>{isSeller ? "Transfer property ownership" : "Collect security deposit"}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>{isSeller ? "Receive payment" : "Hand over keys to tenant"}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      // Complete the process
                      setPropertyRequest(prev => ({
                        ...prev,
                        status: 'completed',
                        adminApproval: 'approved',
                        contractDetails: { signed: true, date: new Date().toISOString() },
                        paymentStatus: 'completed'
                      }));
                      toast.success(isSeller ? "Transaction completed!" : "Lease agreement signed!");
                    }}
                    disabled={isLoading}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Processing..." : isSeller ? "Complete Transaction" : "Sign Lease Agreement"}
                  </button>
                  <button
                    onClick={() => setShowChat(true)}
                    className="w-full bg-transparent border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black font-bold py-4 px-6 rounded-lg transition-all duration-300"
                  >
                    Get Help from Broker
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="relative mx-auto w-36 h-36 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                  <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                </div>
                <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                  Congratulations! 🎉
                </h4>
                <div className="max-w-2xl mx-auto mb-10">
                  <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {isSeller
                      ? "Your property has been successfully listed and the transaction is complete!"
                      : "Your rental property is now listed and the lease agreement is active!"
                    }
                  </p>
                  <div className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <span className="text-xl font-semibold">
                        {isSeller ? "Transaction Complete" : "Lease Active"}
                      </span>
                    </div>
                    <p className="text-sm mb-4">
                      {isSeller
                        ? "You will receive payment according to the agreed terms."
                        : "Your tenant can now move in according to the agreement."
                      }
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate("/properties")}
                    className="px-6 py-3 font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Browse Other Properties
                  </button>
                  <button
                    onClick={() => setShowChat(true)}
                    className="px-6 py-3 font-bold bg-transparent border border-green-500 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Contact Broker
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="relative mx-auto w-36 h-36 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-800 rounded-full animate-pulse"></div>
              <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                <Home className={`w-16 h-16 ${theme === "dark" ? "text-amber-200" : "text-amber-500"}`} />
              </div>
            </div>
            <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              Property Listing Journey
            </h4>
            <div className="max-w-2xl mx-auto mb-10">
              <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Follow the steps to list your property successfully
              </p>
            </div>
            <button
              onClick={() => setActiveStep(1)}
              className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
            >
              Start Listing Your Property
            </button>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen  ${theme === "dark"
      ? "bg-gradient-to-br from-gray-950 via-black to-gray-950"
      : "bg-gradient-to-br from-amber-50 via-white to-gray-100"
      } relative overflow-x-hidden`}>

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
                    <Link to="/properties" className="nav-link hover:text-amber-400 transition-colors">
                      Properties
                    </Link>
                  </li>
                  <li>
                    <Link to="/help" className="nav-link hover:text-amber-400 transition-colors">
                      Help
                    </Link>
                  </li>
                  <li>
                    <Link to="/buyer-renter" className="nav-link hover:text-amber-400 transition-colors">
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
                      <Link to="/login-register" className="nav-link bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-all hover:scale-105">
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
                  "Get the Best Price for Your Property"
                ]}
                typingSpeed={80}
                pauseTime={2000}
                className="text-amber-400 font-montserrat"
              />
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {userType === 'seller'
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
            <div className={`p-4 shadow-2xl ${theme === "dark"
              ? "bg-gradient-to-r from-gray-800 to-gray-900 border border-amber-500/20"
              : "bg-gradient-to-r from-white to-gray-50 border border-amber-200"
              }`}>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    if (!canChangeUserType && userType !== "seller") {
                      toast.error("Cannot switch user type after verification");
                      return;
                    }
                    setUserType("seller");
                  }}
                  className={`flex-1 py-5 px-8 font-bold transition-all duration-300 group ${userType === "seller"
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
                    <Home className={`w-6 h-6 transition-transform group-hover:scale-110 ${userType === "seller" ? "text-white" : "text-amber-500"
                      }`} />
                    <span className={`transition-transform font-semibold ${userType === "seller" ? "text-white" : "text-amber-500"
                      }`}>
                      Seller Dashboard
                      {!canChangeUserType && userType === "seller" && " (Locked)"}
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
                  className={`flex-1 py-5 px-8 font-bold transition-all duration-300 group ${userType === "leaser"
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
                    <Key className={`w-6 h-6 transition-transform group-hover:scale-110 ${userType === "leaser" ? "text-white" : "text-amber-500"
                      }`} />
                    <span className={`transition-transform font-semibold ${userType === "seller" ? "text-amber-500" : "text-white"
                      }`}>
                      Renter Dashboard
                      {!canChangeUserType && userType === "leaser" && " (Locked)"}
                    </span>
                  </div>
                </button>
              </div>

              {/* Warning message when type is locked */}
              {!canChangeUserType && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${theme === "dark"
                  ? "bg-amber-900/20 text-amber-300 border border-amber-700/30"
                  : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                  <div className="flex items-center gap-3 ">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">User Type Locked:</span>
                    <p> Your account type is now locked as a <strong>{userType}</strong> after verification completion.
                      Contact support if you need to change account types.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Information Center */}
          <InformationCenter />

          {/* Verification Restriction Modal */}
          {showVerificationRestriction && (
            <VerificationRestrictionModal />
          )}

          {/* Progress Tracker Section */}
          <div ref={progressSectionRef} className="mb-20">
            <div className="text-center mb-12">
              <h3 className={`text-3xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Your <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  Step-by-Step Journey
                </span>
              </h3>
              <p className={`text-lg max-w-2xl mx-auto ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Follow these simple steps to {userType === 'seller' ? 'sell your property' : 'rent out your property'} in Ethiopia
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
              className={`p-10  rounded-3xl border-2 transition-all w-[90%] ml-20 mr-20 duration-700 ${theme === "dark"
                ? "bg-gradient-to-br from-white-900/80 to-gray-800/80 border-amber-500/30"
                : "bg-gradient-to-br from-white to-amber-50 border border-amber-200"
                } shadow-2xl backdrop-blur-sm`}
              style={{
                transform: `translateY(${scrolledProgress * 20}px)`,
                opacity: 0.8 + (scrolledProgress * 0.2)
              }}
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${theme === "dark"
                      ? "bg-gradient-to-r from-amber-900/30 to-orange-900/30"
                      : "bg-gradient-to-r from-amber-100 to-orange-100"
                      }`}>
                      {React.createElement(currentSteps.find(s => s.number === activeStep)?.icon, {
                        className: `w-8 h-8 ${currentSteps.find(s => s.number === activeStep)?.iconColor}`
                      })}
                    </div>
                    <div>
                      <h3 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {currentSteps.find(s => s.number === activeStep)?.title}
                      </h3>
                      <p className={`mt-2 text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                        {currentSteps.find(s => s.number === activeStep)?.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {activeStep > 1 && (
                    <button
                      onClick={() => setActiveStep(activeStep - 1)}
                      className={`flex items-center gap-2 px-4 py-2 font-semibold transition-all duration-300 ${theme === "dark"
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
                        (activeStep === 3 && isVerificationInProgress && verificationStatus?.status !== 'verified')
                      }
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Step Content */}
              <div className="-py-5">
                {renderStepContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <FloatingElements theme={theme} />

      {brokerChatOpen && selectedBroker && (
        <div className="fixed inset-0 z-50">
          <BrokerChatInterface
            isOpen={brokerChatOpen}
            onClose={() => setBrokerChatOpen(false)}
            user={user}
            broker={selectedBroker}
            property={selectedProperty}
          />
        </div>
      )}

      {selectedBroker && (
        <BrokerChatToggle
          theme={theme}
          onToggle={() => setBrokerChatOpen(!brokerChatOpen)}
          brokerName={selectedBroker.name}
          brokerProfile={selectedBroker.profile_picture}
          unreadCount={0} // You would get this from your chat system
        />
      )}
      <NotificationToggle
        onOpenChat={() => {
          if (brokers.length > 0) {
            setSelectedBroker(brokers[0]);
            setShowChat(true);
          } else {
            toast.error("No brokers available at the moment");
          }
        }}
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

      {showChat && selectedBroker && (
        <BrokerChatInterface
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          user={user}
          broker={selectedBroker}
          property={selectedProperty}
        />
      )}

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