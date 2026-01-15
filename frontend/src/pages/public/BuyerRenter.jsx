import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import PropertyDetailsModal from "../../components/PropertyDetailsModal";
import PropertyApplicationModal from "../../components/PropertyApplicationModal";
import BrokerChatInterface from "../../components/BrokerChatInterface";
import ScheduleViewingModal from "../../components/ScheduleViewingModal";
import HeroTypingText from "../../components/HeroTypingText";
import PropertyCardWithChat from "../../components/PropertyCard";
import PaymentHistory from "../../components/PaymentHistory";
import PaymentModal from "../../components/PaymentModal"; // Make sure this component exists
import { toast } from "react-hot-toast";
import {
  ChevronDown, ChevronRight, ArrowRight, ArrowLeft, CheckCircle,
  Home, Building, Users, FileText, Calendar, MapPin, DollarSign,
  Heart, ShieldCheck, Star, Phone, Mail, Award, Clock, Eye,
  MessageCircle, ExternalLink, Image, X, Upload, Camera, Target,
  BarChart3, Bed, Bath, Square, Key, Bookmark, Search, Filter,
  Map, Compass, Navigation, AlertCircle, AlertTriangle, RefreshCw,
  Loader as LoaderIcon, Lock, TrendingUp, Shield, Sparkles, FileCheck,
  Handshake, Check, HelpCircle, CreditCard
} from "lucide-react";

const BuyerRenter = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // State Management
  const [activeStep, setActiveStep] = useState(1);
  const [userType, setUserType] = useState("buyer");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [hasSubmittedDocuments, setHasSubmittedDocuments] = useState(false);
  const [hasSelectedBroker, setHasSelectedBroker] = useState(false);
  const [hasBrokerConfirmed, setHasBrokerConfirmed] = useState(false);
  const [hasAppliedForProperty, setHasAppliedForProperty] = useState(false);
  const [isApplicationPending, setIsApplicationPending] = useState(false);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [resubmissionDocument, setResubmissionDocument] = useState(null);
  const [showResubmissionModal, setShowResubmissionModal] = useState(false);
  const [canChangeUserType, setCanChangeUserType] = useState(true);

  // Modal states
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScheduleViewingModal, setShowScheduleViewingModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVerificationRestriction, setShowVerificationRestriction] = useState(false);

  // Data States
  const [properties, setProperties] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Interactive state
  const [activeInfoCard, setActiveInfoCard] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [scrolledProgress, setScrolledProgress] = useState(0);
  const [isVerificationInProgress, setIsVerificationInProgress] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const [recommendedProperties, setRecommendedProperties] = useState([]);
  const [savingProperty, setSavingProperty] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [lastVerificationCheck, setLastVerificationCheck] = useState(null);

  // Refs
  const progressSectionRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState({
    1: true, // Profile creation is always completed once user is logged in
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
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

  const getVerificationStepIcon = () => {
    if (!verificationStatus) {
      return hasSubmittedDocuments ? Clock : ShieldCheck;
    }

    switch (verificationStatus.status) {
      case 'verified': return CheckCircle;
      case 'needs_resubmission': return AlertCircle;
      case 'reviewing': return Clock;
      case 'submitted': return FileCheck;
      case 'rejected': return AlertTriangle;
      default: return ShieldCheck;
    }
  };

  const getVerificationStepAction = () => {
    return () => {
      if (verificationStatus?.status === 'needs_resubmission') {
        const needsResubmission = userDocuments.filter(doc =>
          doc.status === 'needs_resubmission'
        );

        if (needsResubmission.length === 1) {
          setResubmissionDocument(needsResubmission[0].type);
          setShowDocumentUpload(true);

          if (needsResubmission[0].feedback) {
            toast.info(`Please resubmit: ${needsResubmission[0].feedback}`, {
              duration: 6000,
              icon: '📄'
            });
          }
        } else {
          setShowDocumentUpload(true);
          toast.info('Multiple documents need resubmission', {
            duration: 5000,
            icon: '📄'
          });
        }
      } else if (hasSubmittedDocuments && isVerificationInProgress) {
        setShowVerificationRestriction(true);
        toast.error("Please wait for verification to complete before uploading new documents");
      } else {
        setShowDocumentUpload(true);
      }
    };
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

      if (response.success) {
        const { user: userData, documents, verificationStep } = response;

        const updatedUser = {
          ...user,
          verification_status: userData.verification_status,
          verification_step_status: userData.verification_step_status,
          verification_feedback: userData.verification_feedback,
          documents_need_resubmission: userData.documents_need_resubmission,
          has_submitted_documents: userData.has_submitted_documents,
          documents_submitted_at: userData.documents_submitted_at,
          last_verification_review_at: userData.last_verification_review_at
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

        if (userData.verification_step_status === 'verified') {
          setCompletedSteps(prev => ({ ...prev, 2: true }));
        }

        const statusData = {
          status: userData.verification_step_status,
          feedback: userData.verification_feedback,
          needsResubmission: userData.documents_need_resubmission,
          lastReviewed: userData.last_verification_review_at,
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
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      if (forceCheck) {
        const storedDocs = localStorage.getItem(`user_documents_${user.id}`);
        if (storedDocs) {
          const docs = JSON.parse(storedDocs);
          setUserDocuments(docs);

          const hasSubmitted = docs.length > 0;
          const isPending = docs.some(doc =>
            doc.status === 'pending' ||
            doc.status === 'submitted' ||
            doc.status === 'reviewing'
          );

          setHasSubmittedDocuments(hasSubmitted);
          setIsVerificationInProgress(isPending);

          return {
            status: isPending ? 'pending' : 'unknown',
            feedback: null,
            needsResubmission: false,
            lastReviewed: null
          };
        }
      }
    }
    return null;
  }, [user, verificationStatus, lastVerificationCheck]);

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
        toast.info('🔍 Your documents are now being reviewed by our team', {
          duration: 4000,
          icon: '👀'
        });
        break;
    }
  };

  // ========== STEP DEFINITIONS ==========

  const getStepConfig = useCallback(() => {
    const getStep4Description = () => {
      return completedSteps[4]
        ? "Viewing scheduled"
        : (savedProperties.length > 0
          ? `${savedProperties.length} saved - Book viewing`
          : "Save properties to schedule viewings");
    };

    const handleBuyerStep4Action = () => {
      if (savedProperties.length > 0) {
        const property = savedProperties[0];
        setSelectedProperty(property);
        if (property.broker) {
          setSelectedBroker(property.broker);
        }
        setShowScheduleViewingModal(true);

        setCompletedSteps(prev => {
          const updated = { ...prev, 4: true };
          localStorage.setItem('completed_steps', JSON.stringify(updated));
          return updated;
        });
      } else if (properties.length > 0) {
        toast.info("Save a property first to schedule viewing. Click the heart icon on any property to save it.");
        setActiveStep(3);
      } else {
        toast.info("No properties available. Please check back later.");
      }
    };

    const handleRenterStep4Action = () => {
      if (savedProperties.length > 0) {
        const property = savedProperties[0];
        setSelectedProperty(property);
        if (property.broker) {
          setSelectedBroker(property.broker);
        }
        setShowScheduleViewingModal(true);

        setCompletedSteps(prev => {
          const updated = { ...prev, 4: true };
          localStorage.setItem('completed_steps', JSON.stringify(updated));
          return updated;
        });
      } else if (properties.length > 0) {
        const property = properties[0];
        setSelectedProperty(property);
        if (property.broker) {
          setSelectedBroker(property.broker);
        }
        setShowScheduleViewingModal(true);
      } else {
        toast.info("Save a property first to schedule viewing");
      }
    };

    const sharedSteps = [
      {
        number: 1,
        title: "Create Profile",
        description: "Profile setup completed",
        icon: Users,
        action: () => setShowProfileSetup(true),
        completed: completedSteps[1],
        color: completedSteps[1] ? "from-green-500 to-green-600" : "from-amber-800 to-amber-500",
        iconColor: completedSteps[1] ? "text-green-500" : "text-amber-500"
      },
      {
        number: 2,
        title: getVerificationStepTitle(),
        description: getVerificationStepDescription(),
        icon: getVerificationStepIcon(),
        action: getVerificationStepAction(),
        completed: verificationStatus?.status === 'verified' || completedSteps[2],
        color: getVerificationStepColor(),
        iconColor: getVerificationStepIconColor()
      },
      {
        number: 3,
        title: userType === 'buyer' ? "Explore Properties" : "Find Homes",
        description: completedSteps[3]
          ? (userType === 'buyer' ? "Properties explored" : "Homes explored")
          : (userType === 'buyer' ? "Browse dream properties" : "Search perfect rentals"),
        icon: userType === 'buyer' ? Search : Home,
        action: () => {
          if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
            toast.error("Please wait for verification to complete before exploring properties");
            setShowVerificationRestriction(true);
            return;
          }

          setCompletedSteps(prev => {
            const updated = { ...prev, 3: true };
            localStorage.setItem('completed_steps', JSON.stringify(updated));
            return updated;
          });

          if (userType === 'buyer') {
            navigate("/properties?type=sale");
            toast.success("Step 3 completed! Exploring properties for sale...");
          } else {
            navigate("/properties?type=rental");
            toast.success("Step 3 completed! Exploring rental properties...");
          }
        },
        completed: completedSteps[3],
        color: completedSteps[3] ? "from-green-500 to-green-600" : "from-amber-800 to-amber-500",
        iconColor: completedSteps[3] ? "text-green-500" : "text-amber-500"
      }
    ];

    const buyerSpecificSteps = [
      {
        number: 4,
        title: "Schedule Viewing",
        description: getStep4Description(),
        icon: Calendar,
        action: handleBuyerStep4Action,
        completed: completedSteps[4],
        color: completedSteps[4] ? "from-green-500 to-green-600" : "from-amber-800 to-amber-500",
        iconColor: completedSteps[4] ? "text-green-500" : (savedProperties.length > 0 ? "text-amber-500" : "text-amber-500")
      },
      {
        number: 5,
        title: completedSteps[5] ? "Application Submitted" : (hasAppliedForProperty ? "Application Pending" : "Make Offer"),
        description: completedSteps[5] ? "Application submitted" : (hasAppliedForProperty
          ? "Under review by property owner"
          : "Submit purchase application"),
        icon: completedSteps[5] ? CheckCircle : (hasAppliedForProperty ? Clock : FileText),
        action: () => {
          if (savedProperties.length > 0 && !hasAppliedForProperty && !completedSteps[5]) {
            setSelectedProperty(savedProperties[0]);
            setShowApplicationModal(true);
          } else if (completedSteps[5]) {
            toast.info("Your application has already been submitted and is under review.");
          }
        },
        completed: completedSteps[5] || hasAppliedForProperty,
        color: completedSteps[5] ? "from-green-500 to-green-600" : "from-amber-800 to-amber-500",
        iconColor: completedSteps[5] ? "text-green-500" : (hasAppliedForProperty ? "text-amber-400" : "text-amber-500")
      },
      {
        number: 6,
        title: "Secure Ownership",
        description: "Complete payment & transfer",
        icon: Award,
        action: () => {
          setShowPaymentModal(true);
        },
        completed: completedSteps[6],
        color: completedSteps[6] ? "from-green-500 to-green-600" : "from-amber-800 to-amber-500",
        iconColor: completedSteps[6] ? "text-green-500" : "text-amber-500"
      }
    ];

    const renterSpecificSteps = [
      {
        number: 4,
        title: completedSteps[4] ? "Viewing Scheduled" : "Schedule Viewing",
        description: completedSteps[4] ? "Viewing scheduled" : (hasSelectedBroker
          ? "Book rental viewing with broker"
          : "Schedule rental viewing"),
        icon: Calendar,
        action: handleRenterStep4Action,
        completed: completedSteps[4],
        color: completedSteps[4] ? "from-green-500 to-green-600" : "from-amber-800 to-amber-500",
        iconColor: completedSteps[4] ? "text-green-500" : "text-amber-500"
      },
      {
        number: 5,
        title: completedSteps[5] ? "Application Submitted" : (hasAppliedForProperty ? "Application Pending" : "Apply Now"),
        description: completedSteps[5] ? "Application submitted" : (hasAppliedForProperty
          ? "Under review by landlord"
          : "Submit rental application"),
        icon: completedSteps[5] ? CheckCircle : (hasAppliedForProperty ? Clock : FileText),
        action: () => {
          if (savedProperties.length > 0 && !hasAppliedForProperty && !completedSteps[5]) {
            setSelectedProperty(savedProperties[0]);
            setShowApplicationModal(true);
          } else if (completedSteps[5]) {
            toast.info("Your rental application has already been submitted and is under review.");
          }
        },
        completed: completedSteps[5] || hasAppliedForProperty,
        color: completedSteps[5] ? "from-green-500 to-green-600" : "from-amber-800 to-amber-500",
        iconColor: completedSteps[5] ? "text-green-500" : (hasAppliedForProperty ? "text-amber-400" : "text-amber-500")
      },
      {
        number: 6,
        title: "Move In",
        description: "Sign lease & make payment",
        icon: Key,
        action: () => {
          setShowPaymentModal(true);
        },
        completed: completedSteps[6],
        color: completedSteps[6] ? "from-green-500 to-green-600" : "from-amber-800 to-amber-500",
        iconColor: completedSteps[6] ? "text-green-500" : "text-amber-500"
      }
    ];

    if (userType === 'buyer') {
      return [...sharedSteps, ...buyerSpecificSteps];
    } else {
      return [...sharedSteps, ...renterSpecificSteps];
    }
  }, [
    userType,
    verificationStatus,
    isVerificationInProgress,
    hasSelectedBroker,
    hasBrokerConfirmed,
    hasAppliedForProperty,
    savedProperties,
    properties,
    completedSteps,
    navigate,
    hasSubmittedDocuments,
    userDocuments
  ]);

  const currentSteps = getStepConfig();

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

      toast.info(`Please resubmit your ${docType}`, {
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

  const transformProperty = useCallback((property, index) => {
    let images = [];

    if (property.property_image_url) {
      images = [property.property_image_url];
    } else if (property.images && Array.isArray(property.images)) {
      images = property.images.map(img =>
        typeof img === 'object' ? img.image_url || img.url || img : img
      );
    } else if (property.image_url) {
      images = [property.image_url];
    } else if (property.photos && Array.isArray(property.photos)) {
      images = property.photos;
    }

    const processedImages = images.map(img => {
      if (!img || img.trim() === '') return null;
      if (img.startsWith('http')) return img;
      if (img.startsWith('/uploads/') || img.startsWith('/property-images/')) {
        return `http://localhost:5002${img}`;
      }
      return `http://localhost:5002/uploads/property-images/${img}`;
    }).filter(Boolean);

    if (processedImages.length === 0) {
      processedImages.push('https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80');
    }

    const listing_type = property.listing_type || property.property_status || 'sale';
    const property_type = property.property_type || 'house';
    const city = property.city || 'Addis Ababa';

    let brokerData = null;
    if (property.broker && typeof property.broker === 'object') {
      brokerData = {
        id: property.broker.id || property.broker._id || property.broker_id || property.assigned_broker_id,
        name: property.broker.name ||
          `${property.broker.first_name || ''} ${property.broker.last_name || ''}`.trim() ||
          property.broker.username ||
          "Property Agent",
        email: property.broker.email,
        phone_number: property.broker.phone_number,
        profile_picture: property.broker.profile_picture,
        brokerage_firm: property.broker.brokerage_firm || property.broker.company || "Independent Broker",
        experience_years: property.broker.years_experience || property.broker.experience_years || "5+",
        commission_rate: property.broker.commission_rate || "2.5%",
        total_completed_deals: property.broker.completed_deals || property.broker.total_completed_deals || 50,
        average_rating: property.broker.rating || property.broker.average_rating || 4.8,
        is_verified: property.broker.is_verified || false,
        is_available: property.broker.is_available !== false
      };
    }

    return {
      id: property.id || property._id || `property-${index}`,
      title: property.title || property.property_title || `${property_type} in ${city}`,
      description: property.description || `${property_type} in ${city}`,
      property_type: property_type,
      listing_type: listing_type === 'rent' ? 'rent' : 'sale',
      price: property.price || 0,
      location: property.address || property.full_address || city,
      city: city,
      region: property.region || '',
      beds: property.beds || property.bedrooms || 0,
      baths: property.baths || property.bathrooms || 0,
      sqft: parseFloat(property.sqft) || parseFloat(property.area) || 0,
      images: processedImages,
      is_featured: property.is_featured || false,
      main_image: processedImages[0] || '',
      features: property.features || [],
      amenities: property.amenities || [],
      garage: property.garage || 0,
      created_at: property.created_at || new Date().toISOString(),
      views: property.views || 0,
      saves: property.saves || 0,
      broker: brokerData,
      currency: property.currency || 'ETB',
      broker_id: property.broker_id,
      assigned_broker_id: property.assigned_broker_id,
      property_status: property.property_status,
      is_negotiable: property.is_negotiable,
      is_exclusive: property.is_exclusive,
      is_premium: property.is_premium,
      year_built: property.year_built,
      lot_size: property.lot_size,
      isSaved: false
    };
  }, []);

  const loadActualProperties = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      let propertiesResponse;
      try {
        propertiesResponse = await apiCall('GET_PROPERTIES');
      } catch (error) {
        if (error.message.includes('429')) {
          toast.error("Too many requests. Please wait a moment.");
          const cachedProps = localStorage.getItem('cached_properties');
          if (cachedProps) {
            propertiesResponse = JSON.parse(cachedProps);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      if (propertiesResponse) {
        localStorage.setItem('cached_properties', JSON.stringify(propertiesResponse));
      }

      let propertiesData = [];

      if (propertiesResponse) {
        if (propertiesResponse.success && propertiesResponse.data && Array.isArray(propertiesResponse.data.properties)) {
          propertiesData = propertiesResponse.data.properties;
        } else if (propertiesResponse.success && Array.isArray(propertiesResponse.data)) {
          propertiesData = propertiesResponse.data;
        } else if (Array.isArray(propertiesResponse)) {
          propertiesData = propertiesResponse;
        } else if (propertiesResponse.data && Array.isArray(propertiesResponse.data)) {
          propertiesData = propertiesResponse.data;
        }
      }

      const transformedProperties = propertiesData.map(transformProperty).filter(Boolean);

      let filteredProperties = transformedProperties;

      if (user.role === 'buyer' || userType === 'buyer') {
        filteredProperties = transformedProperties.filter(p =>
          p.listing_type === 'sale' || p.listing_type === 'For Sale'
        );
      } else if (user.role === 'renter' || userType === 'renter') {
        filteredProperties = transformedProperties.filter(p =>
          p.listing_type === 'rent' || p.listing_type === 'For Rent'
        );
      }

      const userPreferences = JSON.parse(localStorage.getItem(`user_preferences_${user.id}`)) || user.preferences || {};
      const hasPreferences = Object.keys(userPreferences).length > 0;
      let recommendedProperties = [];
      let otherProperties = [];

      if (hasPreferences) {
        recommendedProperties = filteredProperties.filter(p => {
          let matches = true;

          if (userPreferences.property_type && p.property_type !== userPreferences.property_type) {
            matches = false;
          }
          if (userPreferences.city && p.city !== userPreferences.city) {
            matches = false;
          }
          if (userPreferences.max_price && p.price > userPreferences.max_price) {
            matches = false;
          }
          if (userPreferences.min_beds && p.beds < userPreferences.min_beds) {
            matches = false;
          }

          return matches;
        });

        if (recommendedProperties.length === 0) {
          recommendedProperties = filteredProperties.filter(p => {
            let matchCount = 0;
            let totalCriteria = 0;

            if (userPreferences.property_type) {
              totalCriteria++;
              if (p.property_type === userPreferences.property_type) matchCount++;
            }
            if (userPreferences.city) {
              totalCriteria++;
              if (p.city === userPreferences.city) matchCount++;
            }
            if (userPreferences.max_price) {
              totalCriteria++;
              if (p.price <= userPreferences.max_price) matchCount++;
            }
            if (userPreferences.min_beds) {
              totalCriteria++;
              if (p.beds >= userPreferences.min_beds) matchCount++;
            }

            const matches = totalCriteria > 0 && matchCount >= Math.ceil(totalCriteria / 2);
            return matches;
          });
        }

        if (recommendedProperties.length === 0) {
          recommendedProperties = filteredProperties.slice(0, 4);
        }

        otherProperties = filteredProperties.filter(p =>
          !recommendedProperties.some(rp => rp.id === p.id)
        ).slice(0, 6);

      } else {
        recommendedProperties = filteredProperties.slice(0, 3);
        otherProperties = filteredProperties.slice(3, 9);
      }

      setProperties(otherProperties);
      setRecommendedProperties(recommendedProperties);

      await fetchSavedProperties();

    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error("Failed to load properties");
      setProperties([]);
      setRecommendedProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, userType, transformProperty]);

  const fetchSavedProperties = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const response = await apiCall('GET_SAVED_PROPERTIES');

      if (response && response.success && response.data) {
        const savedProps = response.data.map(property => ({
          ...transformProperty(property),
          isSaved: true
        }));

        const savedIds = savedProps.map(property => property.id);
        setSavedProperties(savedProps);

        localStorage.setItem(`saved_properties_${user.id}`, JSON.stringify(savedProps));

        if (savedProps.length > 0 && !completedSteps[3]) {
          setCompletedSteps(prev => {
            const updated = { ...prev, 3: true };
            localStorage.setItem('completed_steps', JSON.stringify(updated));
            toast.success("Step 3 completed! You have saved properties.");
            return updated;
          });
        }

        setProperties(prev => prev.map(property => ({
          ...property,
          isSaved: savedIds.includes(property.id)
        })));

        setRecommendedProperties(prev => prev.map(property => ({
          ...property,
          isSaved: savedIds.includes(property.id)
        })));

        return savedProps;
      }
    } catch (error) {
      console.log('Could not fetch saved properties:', error);
    }
  }, [user, transformProperty, completedSteps]);

  const fetchBrokers = useCallback(async () => {
    try {
      const response = await apiCall('GET_BROKERS');
      if (response && Array.isArray(response)) {
        setBrokers(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setBrokers(response.data);
      }
    } catch (error) {
      console.log('Could not fetch brokers:', error);
    }
  }, []);

  useEffect(() => {
    const step4Handler = async () => {
      if (activeStep === 4 && user) {
        try {
          if (properties.length === 0) {
            await loadActualProperties();
          }

          await fetchSavedProperties();
        } catch (error) {
          console.error('Error loading Step 4 data:', error);
        }
      }
    };

    step4Handler();
  }, [activeStep, user, loadActualProperties, fetchSavedProperties, properties.length]);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (isInitializedRef.current) return;

      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || !userData.id) {
          navigate("/login-register", { state: { returnUrl: "/buyer-renter" } });
          return;
        }

        setUser(userData);
        setIsVerified(userData.is_verified || false);

        if (userData.role === 'buyer' || userData.role === 'renter') {
          setUserType(userData.role);
        }

        const savedCompletedSteps = localStorage.getItem('completed_steps');
        if (savedCompletedSteps) {
          try {
            const parsedSteps = JSON.parse(savedCompletedSteps);
            setCompletedSteps(parsedSteps);
          } catch (error) {
            console.error('Error loading completed steps:', error);
          }
        }

        const cachedDocs = localStorage.getItem(`user_documents_${userData.id}`);
        const cachedProperties = localStorage.getItem('cached_properties');
        const cachedBrokers = localStorage.getItem('cached_brokers');
        const cachedVerification = localStorage.getItem(`verification_status_${userData.id}`);
        const cachedSavedProperties = localStorage.getItem(`saved_properties_${userData.id}`);

        if (cachedDocs) {
          setUserDocuments(JSON.parse(cachedDocs));
        }

        if (cachedVerification) {
          const verificationData = JSON.parse(cachedVerification);
          setVerificationStatus(verificationData);
          setHasSubmittedDocuments(verificationData.hasSubmitted || false);
          setIsVerificationInProgress(verificationData.isInProgress || false);
          setLastVerificationCheck(verificationData.lastChecked || null);

          if (verificationData.status === 'verified') {
            setCompletedSteps(prev => {
              const updated = { ...prev, 2: true };
              localStorage.setItem('completed_steps', JSON.stringify(updated));
              return updated;
            });
          }
        }

        if (cachedProperties) {
          const propertiesData = JSON.parse(cachedProperties);
          if (Array.isArray(propertiesData)) {
            setProperties(propertiesData);
          }
        }

        if (cachedBrokers) {
          const brokersData = JSON.parse(cachedBrokers);
          if (Array.isArray(brokersData)) {
            setBrokers(brokersData);
          }
        }

        if (cachedSavedProperties) {
          try {
            const savedProps = JSON.parse(cachedSavedProperties);
            if (Array.isArray(savedProps) && savedProps.length > 0) {
              if (!completedSteps[3]) {
                setCompletedSteps(prev => {
                  const updated = { ...prev, 3: true };
                  localStorage.setItem('completed_steps', JSON.stringify(updated));
                  return updated;
                });
              }
            }
          } catch (error) {
            console.error('Error parsing saved properties cache:', error);
          }
        }

        setCompletedSteps(prev => {
          if (!prev[1]) {
            const updated = { ...prev, 1: true };
            localStorage.setItem('completed_steps', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });

        const fetchResults = await Promise.allSettled([
          fetchBrokers(),
          loadActualProperties(),
          checkVerificationStatus()
        ]);

        const savedPropsResponse = fetchResults[1];
        if (savedPropsResponse.status === 'fulfilled') {
          setTimeout(() => {
            if (savedProperties.length > 0 && !completedSteps[3]) {
              setCompletedSteps(prev => {
                const updated = { ...prev, 3: true };
                localStorage.setItem('completed_steps', JSON.stringify(updated));
                return updated;
              });
            }
          }, 500);
        }

      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
        isInitializedRef.current = true;
      }
    };

    const timer = setTimeout(() => {
      initializeDashboard();
    }, 100);

    return () => clearTimeout(timer);
  }, [checkVerificationStatus, loadActualProperties, fetchBrokers, navigate, savedProperties.length, completedSteps]);

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
      await handleEditProfile(updatedData);
      toast.success("Profile setup completed!");
      setShowProfileSetup(false);
      setActiveStep(2);

      await loadActualProperties();
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

  const handleSaveProperty = async (propertyId, isCurrentlySaved) => {
    if (!user) {
      const shouldLogin = window.confirm("Please login to save properties. Would you like to login now?");
      if (shouldLogin) {
        navigate("/login-register", {
          state: { returnUrl: "/buyer-renter", message: "Please login to save properties" }
        });
      }
      return;
    }

    setSavingProperty(propertyId);
    try {
      const response = await apiCall('SAVE_PROPERTY', { propertyId }, {
        method: 'POST',
        data: {
          save: !isCurrentlySaved
        }
      });

      if (response) {
        if (response.success === true) {
          if (isCurrentlySaved) {
            setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
            toast.success("Property removed from saved list");
          } else {
            const property = properties.find(p => p.id === propertyId);
            if (property) {
              setSavedProperties(prev => [...prev, property]);
              toast.success("Property saved!");

              if (savedProperties.length === 0 && !completedSteps[3]) {
                setCompletedSteps(prev => {
                  const updated = { ...prev, 3: true };
                  localStorage.setItem('completed_steps', JSON.stringify(updated));
                  toast.success("Step 3 completed! You've saved your first property.");
                  return updated;
                });
              }
            }
          }

          setProperties(prev => prev.map(p => {
            if (p.id === propertyId) {
              return {
                ...p,
                saves: response.data?.savesCount || p.saves + (isCurrentlySaved ? -1 : 1),
                isSaved: !isCurrentlySaved
              };
            }
            return p;
          }));
        }
      }
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(error.message || "Failed to save property");
    } finally {
      setSavingProperty(null);
    }
  };

  const handleApplyForProperty = async (propertyId, applicationData) => {
    try {
      setIsLoading(true);
      setHasAppliedForProperty(true);
      setIsApplicationPending(true);

      setCompletedSteps(prev => {
        const updated = { ...prev, 5: true };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });

      toast.success(`${userType === 'buyer' ? 'Purchase' : 'Rental'} application submitted successfully!`);
      setShowApplicationModal(false);
      setActiveStep(6);
    } catch (error) {
      toast.error("Failed to submit application");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPropertyDetails = (property) => {
    setSelectedProperty(property);
    setShowPropertyDetails(true);
  };

  const handleOpenChatWithBroker = (broker) => {
    setSelectedBroker(broker);
    setShowChat(true);
  };

  const handleNavigateToSection = (section) => {
    navigate(`/${section}`);
  };

  const handleStepClick = async (stepNumber) => {
    const step = currentSteps.find(s => s.number === stepNumber);

    if (stepNumber === 3 && isVerificationInProgress && verificationStatus?.status !== 'verified') {
      toast.error("Please wait for verification to complete before exploring properties");
      setShowVerificationRestriction(true);
      return;
    }

    if (step && step.action) step.action();
    setActiveStep(stepNumber);
  };

  const handleContinueStep = async () => {
    if (activeStep < currentSteps.length) {
      if (activeStep === 2 && isVerificationInProgress && verificationStatus?.status !== 'verified') {
        toast.error("Please wait for verification to complete before exploring properties");
        setShowVerificationRestriction(true);
        return;
      }
      setActiveStep(activeStep + 1);
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setIsLoading(true);

      setCompletedSteps(prev => {
        const updated = { ...prev, 6: true };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });

      toast.success("Payment processed successfully!");
      setShowPaymentModal(false);
    } catch (error) {
      toast.error("Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleViewing = async (viewingData) => {
    try {
      setIsLoading(true);

      setCompletedSteps(prev => {
        const updated = { ...prev, 4: true };
        localStorage.setItem('completed_steps', JSON.stringify(updated));
        return updated;
      });

      toast.success("Viewing scheduled successfully! The broker will contact you shortly.");
      setShowScheduleViewingModal(false);
    } catch (error) {
      toast.error("Failed to schedule viewing");
    } finally {
      setIsLoading(false);
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
          toast.success('✅ Verification complete! You can now explore properties.');
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
      buyer: [
        {
          id: 0,
          icon: TrendingUp,
          title: "Smart Investment",
          description: "Capitalize on Ethiopia's growing real estate market with properties showing 12-18% annual appreciation.",
          highlight: "High Returns",
          action: () => {
            if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
              toast.error("Please wait for verification to complete before exploring properties");
              return;
            }
            navigate("/properties?type=investment");
          }
        },
        {
          id: 1,
          icon: ShieldCheck,
          title: "Secure Transactions",
          description: "End-to-end verification process ensuring legal compliance and ownership security.",
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
          icon: BarChart3,
          title: "Market Intelligence",
          description: "Access exclusive data analytics, neighborhood insights, and investment projections.",
          highlight: "Data-Driven",
          action: () => {
            if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
              toast.error("Please wait for verification to complete before exploring market insights");
              return;
            }
            navigate("/market-insights");
          }
        },
        {
          id: 3,
          icon: Handshake,
          title: "Expert Guidance",
          description: "Connect with certified Ethiopian brokers offering local expertise and market knowledge.",
          highlight: "Local Partners",
          action: () => brokers.length > 0 && handleOpenChatWithBroker(brokers[0])
        }
      ],
      renter: [
        {
          id: 0,
          icon: Shield,
          title: "Safe & Secure",
          description: "Verified properties with secure payments and legally binding rental agreements.",
          highlight: "Peace of Mind",
          action: () => {
            if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
              toast.error("Please wait for verification to complete before exploring properties");
              return;
            }
            navigate("/properties?type=rental");
          }
        },
        {
          id: 1,
          icon: Key,
          title: "Quick Move-In",
          description: "Ready-to-occupy properties with all amenities included for immediate settlement.",
          highlight: "Instant Access",
          action: () => {
            if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
              toast.error("Please wait for verification to complete before exploring properties");
              return;
            }
            navigate("/properties?status=available");
          }
        },
        {
          id: 2,
          icon: Users,
          title: "Community Focus",
          description: "Properties located in vibrant communities with amenities and social spaces.",
          highlight: "Quality Living",
          action: () => {
            if (isVerificationInProgress && verificationStatus?.status !== 'verified') {
              toast.error("Please wait for verification to complete before exploring properties");
              return;
            }
            navigate("/properties?amenities=premium");
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
      buyer: [
        {
          step: 1,
          title: "Define Goals",
          description: "Tell us your investment objectives and preferred property types.",
          icon: Target,
          time: "Instant"
        },
        {
          step: 2,
          title: "Browse Properties",
          description: "Explore verified listings with detailed analytics and virtual tours.",
          icon: Search,
          time: "1-3 Days"
        },
        {
          step: 3,
          title: "Consult Experts",
          description: "Get personalized advice from local real estate specialists.",
          icon: Users,
          time: "1-2 Days"
        },
        {
          step: 4,
          title: "Schedule Viewing",
          description: "Book property tours with certified brokers for inspection.",
          icon: Calendar,
          time: "2-5 Days"
        }
      ],
      renter: [
        {
          step: 1,
          title: "Set Preferences",
          description: "Define your ideal location, budget, and rental requirements.",
          icon: Map,
          time: "Instant"
        },
        {
          step: 2,
          title: "Find Homes",
          description: "Discover available rentals matching your criteria.",
          icon: Home,
          time: "1-2 Days"
        },
        {
          step: 3,
          title: "Tour & Inspect",
          description: "Schedule viewings and property inspections.",
          icon: Eye,
          time: "2-4 Days"
        },
        {
          step: 4,
          title: "Move In",
          description: "Sign digital lease and settle into your new home.",
          icon: Key,
          time: "1-3 Days"
        }
      ]
    };
    return baseJourneys[userType];
  };

  const infoCards = getInfoCards();
  const journeySteps = getJourneySteps();

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "ETB 0";
    if (amount >= 1000000) return `ETB ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `ETB ${(amount / 1000).toFixed(0)}K`;
    return `ETB ${amount.toLocaleString()}`;
  };

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

    return (
      <div className="text-center py-8">
        <div className="relative mx-auto w-36 h-36 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-800 rounded-full animate-pulse"></div>
          <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
            {verificationStatus?.status === 'verified' ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : verificationStatus?.status === 'needs_resubmission' ? (
              <AlertCircle className="w-16 h-16 text-amber-500" />
            ) : hasSubmittedDocuments ? (
              <Clock className="w-16 h-16 text-amber-500 animate-pulse" />
            ) : (
              <ShieldCheck className="w-16 h-16 text-amber-500" />
            )}
          </div>
        </div>

        <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
          {getVerificationStepTitle()}
        </h4>

        <div className="max-w-2xl mx-auto mb-10">
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

          {isVerificationInProgress && (
            <div className={`p-6 rounded-xl ${theme === "dark"
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
            <div className={`mt-6 p-4 rounded-lg ${theme === "dark"
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
          {verificationStatus?.status === 'needs_resubmission' ? (
            <button
              onClick={() => {
                setShowDocumentUpload(true);
                toast.info('Please upload corrected documents as requested', { icon: '📄' });
              }}
              className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
            >
              <Upload className="inline w-5 h-5 mr-2" />
              Resubmit Documents
            </button>
          ) : isUploadDisabled ? (
            <button
              onClick={() => {
                setShowVerificationRestriction(true);
                toast.error("Cannot upload new documents during verification");
              }}
              className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white mr-4 cursor-not-allowed opacity-70"
              disabled
            >
              <Lock className="inline w-5 h-5 mr-2" />
              Upload Disabled
            </button>
          ) : (
            <button
              onClick={() => setShowDocumentUpload(true)}
              className="px-10 py-4 font-semibold Button2 "
            >
              <Upload className="inline w-5 h-5 mr-2" />
              {hasSubmittedDocuments ? 'Upload Additional Documents' : 'Upload Required Documents'}
            </button>
          )}

          <button
            onClick={handleManualVerificationCheck}
            disabled={isLoading}
            className="px-10 py-4 font-semibold Button2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white hover:text-white  flex items-center justify-center gap-2 mx-auto"
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

          {isVerificationInProgress && verificationStatus?.status !== 'verified' && (
            <p className={`text-sm mt-3 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
              You must wait for verification to complete before proceeding
            </p>
          )}
        </div>
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
    const isBuyer = userType === 'buyer';

    return (
      <div className="mb-16">
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-3 mb-4 px-6 py-3 rounded-full ${theme === "dark"
            ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
            : "bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200"
            }`}>
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-semibold text-amber-600 ">
              {isBuyer ? "Property Ownership Journey" : "Perfect Home Search"}
            </span>
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>

          <h2 className={`text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r ${isBuyer
            ? "from-amber-500 to-amber-700"
            : "from-amber-700 to-amber-500"
            } bg-clip-text text-transparent`}>
            {isBuyer ? "Your Ethiopian Dream Property Awaits" : "Find Your Perfect Ethiopian Home"}
          </h2>

          <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}>
            {isBuyer
              ? "Navigate Ethiopia's vibrant real estate landscape with confidence. From prime investments to family homes, experience seamless ownership with local expertise."
              : "Discover comfortable, secure rentals across Ethiopia. Verified properties, transparent contracts, and a stress-free moving experience designed for you."
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
                  <span>Start Exploring</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
              <div className="flex-1">
                <div className="relative h-64 lg:h-80 group-hover:scale-105 transition-transform duration-500">
                  <img
                    src={isBuyer ? "/vectors/SellHouse.svg" : "/vectors/RentHouse.svg"}
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
                {isBuyer ? 'Purchase' : 'Rental'} Journey
              </span>
            </h3>
            <p className={`text-lg max-w-2xl mx-auto ${theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}>
              Follow these simple steps to find your perfect {isBuyer ? 'property' : 'home'} in Ethiopia
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

  return (
    <div className={`min-h-screen ${theme === "dark"
      ? "bg-gradient-to-br from-gray-950 via-black to-gray-950"
      : "bg-gradient-to-br from-amber-50 via-white to-gray-100"
      } relative overflow-x-hidden`}>

      {isLoading && <Loader theme={theme} />}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* Hero Background */}
      <div
        className="relative h-[600px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/imgs/userHouse1.jpg')`,
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
                    <Link to="/seller-leaser" className="nav-link hover:text-amber-400 transition-colors">
                      List Property
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
                  "Find Your Dream Home in Ethiopia",
                  "Verified Properties • Trusted Brokers",
                  "Secure Transactions • Easy Process",
                  "Your Journey Starts Here"
                ]}
                typingSpeed={80}
                pauseTime={2000}
                className="text-amber-400 font-montserrat"
              />
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {userType === 'buyer'
                ? "Your journey to property ownership starts here"
                : "Find your perfect rental home with trusted brokers"}
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
                    if (!canChangeUserType && userType !== "buyer") {
                      toast.error("Cannot switch user type after verification");
                      return;
                    }
                    setUserType("buyer");
                  }}
                  className={`flex-1 py-5 px-8 font-bold transition-all duration-300 group ${userType === "buyer"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl scale-105"
                    : theme === "dark"
                      ? canChangeUserType
                        ? "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700"
                        : "bg-gradient-to-r from-gray-800 to-gray-900 text-gray-500 cursor-not-allowed"
                      : canChangeUserType
                        ? "bg-gradient-to-r from-gray-200 to-gray-300 text-amber-100 hover:bg-gradient-to-r hover:from-amber-100 hover:to-gray-400"
                        : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-400 cursor-not-allowed"
                    }`}
                  disabled={!canChangeUserType && userType !== "buyer"}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Home className={`w-6 h-6 transition-transform group-hover:scale-110 ${userType === "buyer" ? "text-white" : "text-amber-500"
                      }`} />
                    <span className={`transition-transform font-semibold ${userType === "buyer" ? "text-white" : "text-amber-500"
                      }`}>
                      Buyer Dashboard
                      {!canChangeUserType && userType === "buyer" && " (Locked)"}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (!canChangeUserType && userType !== "renter") {
                      toast.error("Cannot switch user type after verification");
                      return;
                    }
                    setUserType("renter");
                  }}
                  className={`flex-1 py-5 px-8 font-bold transition-all duration-300 group ${userType === "renter"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xl scale-105"
                    : theme === "dark"
                      ? canChangeUserType
                        ? "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700"
                        : "bg-gradient-to-r from-gray-800 to-gray-900 text-gray-500 cursor-not-allowed"
                      : canChangeUserType
                        ? "bg-gradient-to-r from-gray-200 to-gray-300 text-amber-100 hover:bg-gradient-to-r hover:from-amber-100 hover:to-gray-400"
                        : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-400 cursor-not-allowed"
                    }`}
                  disabled={!canChangeUserType && userType !== "renter"}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Key className={`w-6 h-6 transition-transform group-hover:scale-110 ${userType === "renter" ? "text-white" : "text-amber-500"
                      }`} />
                    <span className={`transition-transform font-semibold ${userType === "buyer" ? "text-amber-500" : "text-white"
                      }`}>
                      Renter Dashboard
                      {!canChangeUserType && userType === "renter" && " (Locked)"}
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
                Follow these simple steps to achieve your {userType === 'buyer' ? 'property ownership' : 'perfect rental'} goals in Ethiopia
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
              className={`p-10 rounded-3xl border-2 transition-all duration-700 ${theme === "dark"
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
                        (activeStep === 2 && isVerificationInProgress && verificationStatus?.status !== 'verified') ||
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
                {activeStep === 1 ? (
                  completedSteps[1] ? (
                    <div className="text-center py-8">
                      <div className="relative mx-auto w-36 h-36 mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                        <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                          <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                      </div>
                      <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                        Profile Setup Complete
                      </h4>
                      <div className="max-w-2xl mx-auto mb-10">
                        <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          Your profile has been successfully set up. You can update your preferences anytime.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div className={`p-4 rounded-xl text-center ${theme === "dark"
                            ? "bg-green-900/20 border border-green-700"
                            : "bg-green-50 border border-green-200"
                            }`}>
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <p className="font-medium">Profile Created</p>
                          </div>
                          <div className={`p-4 rounded-xl text-center ${theme === "dark"
                            ? "bg-green-900/20 border border-green-700"
                            : "bg-green-50 border border-green-200"
                            }`}>
                            <Map className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <p className="font-medium">Preferences Saved</p>
                          </div>
                          <div className={`p-4 rounded-xl text-center ${theme === "dark"
                            ? "bg-green-900/20 border border-green-700"
                            : "bg-green-50 border border-green-200"
                            }`}>
                            <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <p className="font-medium">Ready to Verify</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowProfileSetup(true)}
                        className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      >
                        Update Profile
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="relative mx-auto w-36 h-36 mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-800 rounded-full animate-pulse"></div>
                        <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                          <Users className={`w-16 h-16 ${theme === "dark" ? "text-amber-200" : "text-amber-500"} `} />
                        </div>
                      </div>
                      <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                        Complete Your Personalized Profile
                      </h4>
                      <div className="max-w-2xl mx-auto mb-10">
                        <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          Share your preferences, budget, and desired locations to receive personalized property recommendations.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div className={`p-4 rounded-xl text-center ${theme === "dark"
                            ? "bg-gray-800/50 border border-gray-700"
                            : "bg-amber-50 border border-amber-200"
                            }`}>
                            <Target className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                            <p className="font-medium">Set Preferences</p>
                          </div>
                          <div className={`p-4 rounded-xl text-center ${theme === "dark"
                            ? "bg-gray-800/50 border border-gray-700"
                            : "bg-amber-50 border border-amber-200"
                            }`}>
                            <Map className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                            <p className="font-medium">Choose Locations</p>
                          </div>
                          <div className={`p-4 rounded-xl text-center ${theme === "dark"
                            ? "bg-gray-800/50 border border-gray-700"
                            : "bg-amber-50 border border-amber-200"
                            }`}>
                            <DollarSign className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                            <p className="font-medium">Define Budget</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <button
                          onClick={() => setShowProfileSetup(true)}
                          className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                        >
                          Start Profile Setup
                        </button>
                        <button
                          onClick={handleContinueStep}
                          className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                        >
                          Skip for Now & Continue
                        </button>
                      </div>
                    </div>
                  )
                ) : activeStep === 2 ? (
                  <VerificationStatus />
                ) : activeStep === 3 ? (
                  completedSteps[3] ? (
                    <div className="text-center py-8">
                      <div className="relative mx-auto w-36 h-36 mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                        <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                          <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                      </div>
                      <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                        Properties Explored
                      </h4>
                      <div className="max-w-2xl mx-auto mb-10">
                        <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          You've successfully explored properties. Continue to save properties and schedule viewings.
                        </p>
                        <div className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <Heart className="w-8 h-8 text-green-500" />
                            <span className="text-xl font-semibold">{savedProperties.length} Saved Properties</span>
                          </div>
                          <p className="text-sm mb-4">Save more properties to schedule viewings in the next step.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/properties")}
                        className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      >
                        Explore More Properties
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-center mb-8">
                        <h4 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                          Discover Amazing Properties
                        </h4>
                        <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          Explore hand-picked properties matching your preferences
                        </p>

                        {savedProperties.length > 0 && (
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${theme === "dark" ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                            <Heart className="w-4 h-4" />
                            <span className="text-sm font-medium">You have {savedProperties.length} saved properties</span>
                          </div>
                        )}
                      </div>

                      {/* ADD THE VISUAL INDICATOR HERE */}
                      {!completedSteps[3] && (
                        <div className={`mb-6 p-4 rounded-lg ${theme === "dark" ? "bg-amber-900/20 border border-amber-800/30" : "bg-amber-50 border border-amber-200"}`}>
                          <div className="flex items-center justify-center gap-3">
                            <Heart className="w-5 h-5 text-amber-500" />
                            <div>
                              <p className={`font-medium text-center ${theme === "dark" ? "dark:text-amber-400" : " text-amber-600"}`}>Complete Step 3</p>
                              <p className={`text-sm ${theme === "dark" ? "dark:text-amber-400" : " text-amber-600"}`}>
                                Save at least one property to complete this step
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {savedProperties.length > 0 && (
                        <div className="mb-8">
                          <h5 className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-amber-300" : "text-amber-600"}`}>
                            <div className="flex items-center gap-2">
                              <Heart className="w-5 h-5" />
                              Your Saved Properties
                            </div>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedProperties.slice(0, 3).map((property) => (
                              <PropertyCardWithChat
                                key={property.id}
                                property={property}
                                theme={theme}
                                onViewDetails={handleViewPropertyDetails}
                                onSave={handleSaveProperty}
                                onApply={() => {
                                  setSelectedProperty(property);
                                  setShowApplicationModal(true);
                                }}
                                isSaved={true}
                                broker={property.broker}
                                user={user}
                                isSaving={savingProperty === property.id}
                              />
                            ))}
                          </div>
                          {savedProperties.length > 3 && (
                            <p className={`text-sm text-center mt-3 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              + {savedProperties.length - 3} more saved properties
                            </p>
                          )}
                        </div>
                      )}

                      {recommendedProperties.length > 0 && (
                        <div className="mb-8">
                          <h5 className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-amber-300" : "text-amber-600"}`}>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5" />
                              {hasPreferences ? "Properties Matching Your Preferences" : "Recommended For You"}
                            </div>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedProperties.slice(0, 3).map((property) => (
                              <PropertyCardWithChat
                                key={property.id}
                                property={property}
                                theme={theme}
                                onViewDetails={handleViewPropertyDetails}
                                onSave={handleSaveProperty}
                                onApply={() => {
                                  setSelectedProperty(property);
                                  setShowApplicationModal(true);
                                }}
                                isSaved={savedProperties.some(savedProp => savedProp.id === property.id)}
                                broker={property.broker}
                                user={user}
                                isSaving={savingProperty === property.id}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {properties.length > 0 && (
                        <div className="mb-8">
                          <h5 className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            <div className="flex items-center gap-2">
                              <Compass className="w-5 h-5" />
                              {savedProperties.length > 0 || recommendedProperties.length > 0
                                ? "Explore More Properties"
                                : "Available Properties"}
                            </div>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.slice(0, 6).map((property) => (
                              <PropertyCardWithChat
                                key={property.id}
                                property={property}
                                theme={theme}
                                onViewDetails={handleViewPropertyDetails}
                                onSave={handleSaveProperty}
                                onApply={() => {
                                  setSelectedProperty(property);
                                  setShowApplicationModal(true);
                                }}
                                isSaved={savedProperties.some(p => p.id === property.id)}
                                broker={property.broker}
                                user={user}
                                isSaving={savingProperty === property.id}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {savedProperties.length === 0 && recommendedProperties.length === 0 && properties.length === 0 && (
                        <div className={`text-center py-12 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} border border-amber-200 dark:border-amber-800`}>
                          <Home className="mx-auto text-amber-500 mb-4" size={48} />
                          <h6 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            No Properties Available
                          </h6>
                          <p className={`text-sm mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            {user
                              ? "No properties match your current preferences. Try updating your profile preferences or browse all properties."
                              : "No properties available at the moment. Please check back later."
                            }
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {user && (
                              <>
                                <button
                                  onClick={() => setShowProfileSetup(true)}
                                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium"
                                >
                                  Update Preferences
                                </button>
                                <button
                                  onClick={() => navigate("/properties")}
                                  className="bg-transparent border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white px-6 py-3 rounded-lg font-medium"
                                >
                                  Browse All Properties
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="text-center mt-8">
                        <button
                          onClick={() => navigate("/properties")}
                          className="bg-transparent border-2 Button2 font-bold py-3 px-8"
                          disabled={isVerificationInProgress && verificationStatus?.status !== 'verified'}
                        >
                          Explore All Properties
                        </button>
                        {isVerificationInProgress && verificationStatus?.status !== 'verified' && (
                          <p className={`text-sm mt-3 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
                            Please wait for verification to complete before exploring properties
                          </p>
                        )}
                      </div>
                    </div>
                  )
                ) : activeStep === 4 ? (
                  completedSteps[4] ? (
                    <div className="text-center py-8">
                      <div className="relative mx-auto w-36 h-36 mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                        <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                          <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                      </div>
                      <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                        Viewing Scheduled
                      </h4>
                      <div className="max-w-2xl mx-auto mb-10">
                        <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          Your property viewing has been successfully scheduled. The broker will contact you shortly.
                        </p>
                        <div className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <Calendar className="w-8 h-8 text-green-500" />
                            <span className="text-xl font-semibold">Viewing Confirmed</span>
                          </div>
                          <p className="text-sm mb-4">Check your email for viewing details and instructions.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowScheduleViewingModal(true)}
                        className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      >
                        View Schedule Details
                      </button>
                    </div>
                  ) : (
                    <div className="py-8">
                      <div className="text-center mb-8">
                        <h4 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                          Schedule a Property Viewing
                        </h4>
                        <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          Book a viewing appointment with certified brokers to inspect properties in person
                        </p>
                      </div>

                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your saved properties...</p>
                        </div>
                      ) : savedProperties.length > 0 ? (
                        <div className="mb-8">
                          <div className={`p-4 rounded-xl mb-4 ${theme === "dark" ? "bg-amber-900/20 border border-amber-800" : "bg-amber-50 border border-amber-200"}`}>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 rounded-full bg-amber-500 text-white">
                                <Heart className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-lg">Your Saved Properties ({savedProperties.length})</h5>
                                <p className="text-sm opacity-80">Select a property to schedule viewing</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {savedProperties.map((property, index) => (
                                <div
                                  key={property.id}
                                  className={`p-4 rounded-lg cursor-pointer hover:scale-[1.02] transition-transform ${theme === "dark" ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    if (property.broker) {
                                      setSelectedBroker(property.broker);
                                    } else if (brokers.length > 0) {
                                      setSelectedBroker(brokers[0]);
                                    }
                                    setShowScheduleViewingModal(true);
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                      <img
                                        src={property.main_image || property.images?.[0] || '/imgs/default-property.jpg'}
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src = '/imgs/default-property.jpg';
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <h6 className="font-medium text-sm line-clamp-1">{property.title || 'Untitled Property'}</h6>
                                      <p className="text-xs opacity-70">{property.location || 'Location not specified'}</p>
                                      <p className="text-sm font-bold mt-1 text-amber-600">
                                        {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}: {formatCurrency(property.price || 0)}
                                      </p>
                                      <div className="flex items-center gap-3 mt-2">
                                        {property.beds && (
                                          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                                            {property.beds} bed{property.beds > 1 ? 's' : ''}
                                          </span>
                                        )}
                                        {property.baths && (
                                          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                                            {property.baths} bath{property.baths > 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3 flex justify-end">
                                    <button className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded">
                                      Schedule Viewing
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-center">
                            <button
                              onClick={() => {
                                const property = savedProperties[0];
                                if (property) {
                                  setSelectedProperty(property);
                                  if (property.broker) {
                                    setSelectedBroker(property.broker);
                                  } else if (brokers.length > 0) {
                                    setSelectedBroker(brokers[0]);
                                  }
                                  setShowScheduleViewingModal(true);
                                }
                              }}
                              className="px-8 py-3 font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all duration-300 hover:scale-105"
                            >
                              Schedule Viewing
                            </button>
                            <p className="text-sm mt-3 opacity-70">
                              Click on any property above or use the button to schedule a viewing
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                              <button
                                onClick={() => setActiveStep(3)}
                                className="text-amber-600 hover:text-amber-700 underline text-sm"
                              >
                                Back to Step 3
                              </button>
                              <button
                                onClick={() => navigate("/properties")}
                                className="text-amber-600 hover:text-amber-700 underline text-sm"
                              >
                                Browse More Properties
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} border border-amber-200 dark:border-amber-800`}>
                          <div className="text-center">
                            <Heart className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                            <h6 className="text-lg font-semibold mb-2">No Properties Saved Yet</h6>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                              You need to save properties first to schedule viewings.
                              {user ? ' Browse available properties and click the heart icon (❤️) to save them.' : ' Please login to save properties.'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              {user ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setActiveStep(3);
                                      toast.info('Go to Step 3 to browse and save properties');
                                    }}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg"
                                  >
                                    Go to Step 3
                                  </button>
                                  <button
                                    onClick={() => navigate("/properties")}
                                    className="bg-transparent border border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-6 py-2 rounded-lg"
                                  >
                                    Browse Properties
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => navigate("/login-register")}
                                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg"
                                >
                                  Login to Save Properties
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : activeStep === 5 ? (
                  completedSteps[5] ? (
                    <div className="text-center py-8">
                      <div className="relative mx-auto w-36 h-36 mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                        <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                          <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                      </div>
                      <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                        Application Submitted
                      </h4>
                      <div className="max-w-2xl mx-auto mb-10">
                        <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          Your {userType === 'buyer' ? 'purchase' : 'rental'} application has been successfully submitted and is now under review.
                        </p>
                        <div className={`p-6 rounded-xl mb-6 ${theme === "dark" ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                          <div className="flex items-center justify-center gap-4 mb-4">
                            <FileText className="w-8 h-8 text-green-500" />
                            <span className="text-xl font-semibold">Application Status: Pending Review</span>
                          </div>
                          <p className="text-sm mb-4">You will be notified once your application is reviewed by the property owner.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/applications")}
                        className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      >
                        View Application Status
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="relative mx-auto w-36 h-36 mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-800 rounded-full animate-pulse"></div>
                        <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                          <FileText className={`w-16 h-16 ${theme === "dark" ? "text-amber-200" : "text-amber-500"}`} />
                        </div>
                      </div>
                      <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                        {userType === 'buyer' ? 'Make an Offer' : 'Submit Rental Application'}
                      </h4>
                      <div className="max-w-2xl mx-auto mb-10">
                        <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          {userType === 'buyer'
                            ? "Submit your purchase application for properties you're interested in. Our brokers will guide you through the negotiation process."
                            : "Complete your rental application with the required information. Landlords typically respond within 24-48 hours."
                          }
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div className={`p-4 rounded-xl text-center ${theme === "dark"
                            ? "bg-gray-800/50 border border-gray-700"
                            : "bg-amber-50 border border-amber-200"
                            }`}>
                            <FileText className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                            <p className="font-medium">Submit Application</p>
                          </div>
                          <div className={`p-4 rounded-xl text-center ${theme === "dark"
                            ? "bg-gray-800/50 border border-gray-700"
                            : "bg-amber-50 border border-amber-200"
                            }`}>
                            <Clock className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                            <p className="font-medium">Wait for Review</p>
                          </div>
                          <div className={`p-4 rounded-xl text-center ${theme === "dark"
                            ? "bg-gray-800/50 border border-gray-700"
                            : "bg-amber-50 border border-amber-200"
                            }`}>
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                            <p className="font-medium">Get Approval</p>
                          </div>
                        </div>
                      </div>
                      {savedProperties.length > 0 ? (
                        <div className="space-y-4">
                          <button
                            onClick={() => {
                              setSelectedProperty(savedProperties[0]);
                              setShowApplicationModal(true);
                            }}
                            className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                          >
                            {userType === 'buyer' ? 'Submit Purchase Application' : 'Submit Rental Application'}
                          </button>
                          <button
                            onClick={handleContinueStep}
                            className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                          >
                            Skip & Continue
                          </button>
                        </div>
                      ) : (
                        <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} border border-amber-200 dark:border-amber-800`}>
                          <p className="text-sm mb-4">Save properties first to submit applications.</p>
                          <button
                            onClick={() => setActiveStep(3)}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg"
                          >
                            Go to Step 3 to Save Properties
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ) : activeStep === 6 ? (
                  <div className="py-8">
                    {/* Step Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-3 rounded-xl ${theme === "dark"
                            ? "bg-gradient-to-r from-amber-900/30 to-orange-900/30"
                            : "bg-gradient-to-r from-amber-100 to-orange-100"
                            }`}>
                            {completedSteps[6] ? (
                              <CheckCircle className="w-8 h-8 text-green-500" />
                            ) : userType === 'buyer' ? (
                              <Award className="w-8 h-8 text-amber-500" />
                            ) : (
                              <Key className="w-8 h-8 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <h4 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {completedSteps[6] ? "Payment & Transaction History" : userType === 'buyer' ? "Secure Ownership" : "Move In"}
                            </h4>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                              {completedSteps[6] ? "View all your payments, receipts, and transaction history" : userType === 'buyer' ? "Complete payment & transfer ownership" : "Sign lease & make payment"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!completedSteps[6] && (
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="px-6 py-3 font-semibold Button2 flex items-center gap-2"
                          >
                            <CreditCard className="w-5 h-5" />
                            {userType === 'buyer' ? 'Make Payment' : 'Pay Now'}
                          </button>
                        )}
                        <button
                          onClick={handleContinueStep}
                          className="px-6 py-3 font-semibold bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2"
                          disabled={activeStep >= currentSteps.length}
                        >
                          {activeStep >= currentSteps.length ? 'Completed' : 'Finish Journey'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Payment Status Summary */}
                    {!completedSteps[6] && (
                      <div className={`mb-8 p-6 rounded-xl ${theme === "dark"
                        ? "bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-amber-500/30"
                        : "bg-gradient-to-br from-white to-amber-50 border border-amber-200"
                        }`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${theme === "dark"
                              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20"
                              : "bg-gradient-to-r from-amber-100 to-orange-100"
                              }`}>
                              <DollarSign className="w-6 h-6 text-amber-500" />
                            </div>
                            <h5 className={`font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              Payment Required
                            </h5>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                              Complete your payment to proceed
                            </p>
                          </div>

                          <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${theme === "dark"
                              ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20"
                              : "bg-gradient-to-r from-blue-100 to-cyan-100"
                              }`}>
                              <FileText className="w-6 h-6 text-blue-500" />
                            </div>
                            <h5 className={`font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {userType === 'buyer' ? 'Contract Signing' : 'Lease Agreement'}
                            </h5>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                              {userType === 'buyer' ? 'Sign purchase contract' : 'Sign rental agreement'}
                            </p>
                          </div>

                          <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${theme === "dark"
                              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20"
                              : "bg-gradient-to-r from-green-100 to-emerald-100"
                              }`}>
                              {userType === 'buyer' ? (
                                <Home className="w-6 h-6 text-green-500" />
                              ) : (
                                <Key className="w-6 h-6 text-green-500" />
                              )}
                            </div>
                            <h5 className={`font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {userType === 'buyer' ? 'Ownership Transfer' : 'Move In'}
                            </h5>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                              {userType === 'buyer' ? 'Get property keys & documents' : 'Get keys & access property'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 text-center">
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="px-8 py-3 font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
                          >
                            <CreditCard className="w-5 h-5" />
                            {userType === 'buyer' ? 'Make Property Payment' : 'Pay First Month Rent'}
                          </button>
                          <p className={`text-xs mt-3 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            {userType === 'buyer'
                              ? 'Secure your property with a secure payment. Transactions protected by Wubland.'
                              : 'Secure your rental with first month payment. 100% payment protection.'
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Payment History Section */}
                    <div className={`mb-8 ${theme === "dark"
                      ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700"
                      : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
                      } rounded-xl overflow-hidden`}>
                      <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${theme === "dark"
                              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20"
                              : "bg-gradient-to-r from-green-100 to-emerald-100"
                              }`}>
                              <CreditCard className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <h5 className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                Payment History
                              </h5>
                              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                Track all your transactions and receipts
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowPaymentModal(true)}
                              className="px-4 py-2 font-medium Button2 flex items-center gap-2"
                            >
                              <CreditCard className="w-4 h-4" />
                              New Payment
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* PaymentHistory Component */}
                      {user && (
                        <div className="p-4">
                          <PaymentHistory
                            userType={userType}
                            userId={user.id}
                            theme={theme}
                          />
                        </div>
                      )}
                    </div>

                    {/* Recent Applications Summary */}
                    {applications.length > 0 && (
                      <div className={`mb-8 p-6 rounded-xl ${theme === "dark"
                        ? "bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-800/30"
                        : "bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200"
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h5 className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                Recent Applications
                              </h5>
                              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                Track your property applications
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${theme === "dark"
                            ? "bg-blue-900/30 text-blue-300"
                            : "bg-blue-100 text-blue-700"
                            }`}>
                            {applications.length} {applications.length === 1 ? 'application' : 'applications'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {applications.slice(0, 3).map((app, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg ${theme === "dark"
                                ? "bg-gray-800/50 hover:bg-gray-700/50"
                                : "bg-white hover:bg-gray-50"
                                } border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} transition-colors`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                      src={app.propertyImage || '/imgs/default-property.jpg'}
                                      alt="Property"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h6 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                      {app.propertyTitle || 'Property Application'}
                                    </h6>
                                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                      Submitted {app.submittedDate ? new Date(app.submittedDate).toLocaleDateString() : 'Recently'}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                  }`}>
                                  {app.status || 'pending'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setActiveStep(5)}
                        className={`px-6 py-3 font-semibold transition-all duration-300 ${theme === "dark"
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700"
                          : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400"
                          } flex items-center gap-2`}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Step 5
                      </button>

                      <button
                        onClick={() => navigate("/properties")}
                        className="px-6 py-3 font-semibold Button2 flex items-center gap-2"
                      >
                        <Home className="w-4 h-4" />
                        Browse More Properties
                      </button>

                      <button
                        onClick={() => navigate("/applications")}
                        className="px-6 py-3 font-semibold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View All Applications
                      </button>
                    </div>

                    {/* Help Section */}
                    <div className={`mt-8 p-6 rounded-xl ${theme === "dark"
                      ? "bg-gradient-to-br from-amber-900/10 to-orange-900/10 border border-amber-700/30"
                      : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
                      }`}>
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
                          <HelpCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h6 className={`font-bold text-lg mb-2 ${theme === "dark" ? "text-amber-300" : "text-amber-700"}`}>
                            Need Help with Payments?
                          </h6>
                          <p className={`text-sm mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            Our support team is here to help you with any payment-related questions or issues.
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => navigate("/help")}
                              className="px-4 py-2 text-sm font-medium bg-transparent border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-colors"
                            >
                              Visit Help Center
                            </button>
                            <button
                              onClick={() => {
                                if (brokers.length > 0) {
                                  setSelectedBroker(brokers[0]);
                                  setShowChat(true);
                                } else {
                                  toast.error("No brokers available at the moment");
                                }
                              }}
                              className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                            >
                              Chat with Broker
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Fallback for other steps
                  <div className="text-center py-8">
                    <div className="relative mx-auto w-36 h-36 mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-800 rounded-full animate-pulse"></div>
                      <div className={`absolute inset-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-full flex items-center justify-center`}>
                        {React.createElement(currentSteps.find(s => s.number === activeStep)?.icon, {
                          className: `w-16 h-16 ${theme === "dark" ? "text-amber-200" : "text-amber-500"}`
                        })}
                      </div>
                    </div>
                    <h4 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      {currentSteps.find(s => s.number === activeStep)?.title}
                    </h4>
                    <div className="max-w-2xl mx-auto mb-10">
                      <p className={`text-lg mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                        {currentSteps.find(s => s.number === activeStep)?.description}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <button
                        onClick={() => currentSteps.find(s => s.number === activeStep)?.action()}
                        className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                      >
                        {currentSteps.find(s => s.number === activeStep)?.title}
                      </button>
                      {activeStep < 6 && (
                        <button
                          onClick={handleContinueStep}
                          className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                        >
                          Skip & Continue
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <FloatingElements theme={theme} />

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
      {
        showProfileSetup && (
          <ProfileSetupModal
            isOpen={showProfileSetup}
            onClose={() => setShowProfileSetup(false)}
            user={user}
            onComplete={handleProfileComplete}
            userType={userType}
            ethiopianMode={true}
          />
        )
      }

      {
        showDocumentUpload && (
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
        )
      }

      {
        showChat && selectedBroker && (
          <BrokerChatInterface
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            user={user}
            broker={selectedBroker}
            property={selectedProperty}
          />
        )
      }

      {
        showPropertyDetails && selectedProperty && (
          <PropertyDetailsModal
            property={selectedProperty}
            isOpen={showPropertyDetails}
            onClose={() => setShowPropertyDetails(false)}
            theme={theme}
            onApply={() => {
              setShowPropertyDetails(false);
              setShowApplicationModal(true);
            }}
          />
        )
      }

      {
        showApplicationModal && selectedProperty && (
          <PropertyApplicationModal
            isOpen={showApplicationModal}
            onClose={() => setShowApplicationModal(false)}
            property={selectedProperty}
            userType={userType}
            onSubmit={handleApplyForProperty}
            theme={theme}
          />
        )
      }

      {
        showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSubmit={handlePaymentSubmit}
            userType={userType}
            theme={theme}
          />
        )
      }

      {
        showScheduleViewingModal && selectedProperty && (
          <ScheduleViewingModal
            isOpen={showScheduleViewingModal}
            onClose={() => setShowScheduleViewingModal(false)}
            property={selectedProperty}
            broker={selectedBroker}
            user={user}
            theme={theme}
          />
        )
      }

      <Footer />
    </div >
  );
};

export default BuyerRenter;