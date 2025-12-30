// frontend/src/pages/public/SellerLeaser.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { apiCall } from "../../utils/api.endpoints";
import ThemeToggle from "../../components/ThemeToggle";
import Loader from "../../components/Loader";
import Footer from "../../components/Footer";
import FloatingElements from "../../components/FloatingElements";
import ProfileAvatar from "../../components/ProfileAvatar";
import ProfilePictureModal from "../../components/ProfilePictureModal";
import BrokerProfileModal from "../../components/BrokerProfileModal";
import {
  ChevronDown,
  Home,
  Building,
  Users,
  FileText,
  CheckCircle,
  Calendar,
  MapPin,
  DollarSign,
  ArrowRight,
  UserCheck,
  ClipboardList,
  ShieldCheck,
  Handshake,
  Star,
  Phone,
  Mail,
  MapPin as MapPinIcon,
  Award,
  Clock,
  CheckCircle2,
  Eye,
  MessageCircle,
  ExternalLink,
  ArrowLeft,
  Image,
  X,
  Upload,
  Camera,
} from "lucide-react";
import { toast } from "react-hot-toast";

const SellerLeaser = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeStep, setActiveStep] = useState(1);
  const [userType, setUserType] = useState("seller");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Property Details
    property_type: "",
    location: "",
    price: "",
    price_currency: "ETB",
    verification_method: "",
    description: "",
    property_image: null,

    // Additional fields
    user_type: "seller",
    property_image_url: "",

    // Request tracking
    request_id: null,
    assigned_broker_id: null,
    status: "draft",

    // Step tracking
    current_step: 1,
    step_status: [true, false, false, false, false, false],
  });

  const [imagePreview, setImagePreview] = useState("");
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [loadingBrokers, setLoadingBrokers] = useState(true);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showBrokerProfile, setShowBrokerProfile] = useState(false);
  const [selectedBrokerForProfile, setSelectedBrokerForProfile] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const typingRef = useRef(null);
  const fileInputRef = useRef(null);

  // ========== API INITIALIZATION ==========

  useEffect(() => {
    const initializeAPI = async () => {
      try {
        console.log("🚀 Initializing API...");

        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const authCheck = await apiCall('CHECK_AUTH');
            console.log("✅ User authenticated:", authCheck);
          } catch (authError) {
            console.log("⚠️ Auth check failed, clearing token");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsLoggedIn(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.warn("❌ API initialization failed:", error.message);
      }
    };

    initializeAPI();
  }, []);

  // ========== HANDLER FUNCTIONS ==========

  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await apiCall('UPLOAD_PROFILE', {}, {
        data: formData
      });

      const updatedUser = {
        ...user,
        profile_picture: response.profilePictureUrl || response.imageUrl,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setShowProfileModal(false);
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error.message || "Failed to upload profile picture. Please try again."
      );
      throw error;
    }
  };

  const handleUsernameChange = (newUsername) => {
    setUser((prev) => ({
      ...prev,
      username: newUsername,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/", { replace: true });
      window.location.reload();
    }, 1000);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // ========== USE EFFECT HOOKS ==========

  useEffect(() => {
    if (location.state?.userType) {
      setUserType(location.state.userType);
      setFormData(prev => ({
        ...prev,
        user_type: location.state.userType
      }));
    }
  }, [location.state]);

  useEffect(() => {
    const texts = [
      "Sell Your Property with Confidence",
      "Rent Out Your Space Securely",
      "Verified Brokers, Trusted Process",
    ];

    const currentText = texts[typingIndex];
    let currentChar = 0;
    let timeout;

    const type = () => {
      if (currentChar <= currentText.length) {
        setTypingText(currentText.slice(0, currentChar));
        currentChar++;
        timeout = setTimeout(type, 100);
      } else {
        timeout = setTimeout(() => {
          setTypingIndex((prev) => (prev + 1) % texts.length);
        }, 2000);
      }
    };

    type();

    return () => clearTimeout(timeout);
  }, [typingIndex]);

  useEffect(() => {
    const testUserService = async () => {
      console.log("Testing user service connection...");

      // Test user service on port 5000
      try {
        const response = await fetch('http://localhost:5000/health', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ User service is running on port 5000:", data);

          // Test brokers endpoint directly
          const brokersResponse = await fetch('http://localhost:5000/api/brokers', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });

          if (brokersResponse.ok) {
            const brokersData = await brokersResponse.json();
            console.log("✅ Brokers endpoint is working:", brokersData);
          } else {
            console.log("❌ Brokers endpoint failed:", brokersResponse.status);
          }
        }
      } catch (error) {
        console.log("❌ User service not reachable on port 5000:", error.message);
      }

      // Test registry on port 5008
      try {
        const registryResponse = await fetch('http://localhost:5008/health', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (registryResponse.ok) {
          const data = await registryResponse.json();
          console.log("✅ API Registry is running on port 5008:", data);
        }
      } catch (error) {
        console.log("❌ API Registry not reachable on port 5008:", error.message);
      }
    };

    testUserService();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const loggedIn = !!(token || userData.role);

    setIsLoggedIn(loggedIn);
    setUser(userData);

    if (loggedIn && (userData.role === "seller" || userData.role === "landlord")) {
      const userTypeFromRole = userData.role === "seller" ? "seller" : "leaser";
      setUserType(userTypeFromRole);
      setFormData(prev => ({
        ...prev,
        user_type: userTypeFromRole
      }));
      setActiveStep(2);
    }
  }, []);

  // ========== STEP DEFINITIONS ==========

  const steps = {
    seller: [
      {
        number: 1,
        title: "Property Details",
        description: "Tell us about your property",
        icon: Home,
        requiresLogin: false,
        status: "current",
      },
      {
        number: 2,
        title: "Choose Broker",
        description: "Select your preferred broker",
        icon: Users,
        requiresLogin: true,
        status: "pending",
      },
      {
        number: 3,
        title: "Verification",
        description: "Property verification process",
        icon: ShieldCheck,
        requiresLogin: true,
        status: "pending",
      },
      {
        number: 4,
        title: "Listing",
        description: "Professional listing creation",
        icon: FileText,
        requiresLogin: true,
        status: "pending",
      },
      {
        number: 5,
        title: "Showings",
        description: "Manage viewings and offers",
        icon: Calendar,
        requiresLogin: true,
        status: "pending",
      },
      {
        number: 6,
        title: "Completion",
        description: "Finalize the transaction",
        icon: Handshake,
        requiresLogin: true,
        status: "pending",
      },
    ],
    leaser: [
      {
        number: 1,
        title: "Property Details",
        description: "Tell us about your rental",
        icon: Home,
        requiresLogin: false,
        status: "current",
      },
      {
        number: 2,
        title: "Choose Broker",
        description: "Select your rental specialist",
        icon: Users,
        requiresLogin: true,
        status: "pending",
      },
      {
        number: 3,
        title: "Verification",
        description: "Property verification process",
        icon: ShieldCheck,
        requiresLogin: true,
        status: "pending",
      },
      {
        number: 4,
        title: "Rental Listing",
        description: "Create attractive rental listing",
        icon: FileText,
        requiresLogin: true,
        status: "pending",
      },
      {
        number: 5,
        title: "Tenant Screening",
        description: "Review applications",
        icon: UserCheck,
        requiresLogin: true,
        status: "pending",
      },
      {
        number: 6,
        title: "Lease Agreement",
        description: "Sign rental contract",
        icon: ClipboardList,
        requiresLogin: true,
        status: "pending",
      },
    ],
  };

  const currentSteps = steps[userType];

  // ========== VALIDATION FUNCTIONS ==========

  const validateStep1 = () => {
    const errors = {};

    if (!formData.property_type) {
      errors.property_type = "Property type is required";
    }

    if (!formData.location || formData.location.trim().length < 3) {
      errors.location = "Valid location is required (minimum 3 characters)";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = "Valid price is required";
    }

    if (!formData.verification_method) {
      errors.verification_method = "Please select verification method";
    }

    if (!formData.property_image) {
      errors.property_image = "Please upload at least one property photo";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ========== STEP HANDLING FUNCTIONS ==========

  const handleStepClick = (stepNumber) => {
    const step = currentSteps.find((s) => s.number === stepNumber);

    if (step.requiresLogin && !isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    if (stepNumber > activeStep) {
      if (activeStep === 1 && !validateStep1()) {
        toast.error("Please fix the errors in the form");
        return;
      }
    }

    if (stepNumber <= activeStep + 1 || stepNumber < activeStep) {
      setActiveStep(stepNumber);

      if (stepNumber > activeStep) {
        const newStepStatus = [...formData.step_status];
        newStepStatus[stepNumber - 2] = true;
        setFormData(prev => ({
          ...prev,
          current_step: stepNumber,
          step_status: newStepStatus
        }));
      }
    } else {
      toast.error(`Please complete step ${activeStep} first`);
    }
  };

  const handleGoBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleContinueWithoutLogin = () => {
    setActiveStep(1);
    setShowLoginPrompt(false);
  };

  const handleLoginRedirect = () => {
    navigate("/login-register", {
      state: {
        returnUrl: "/seller-leaser",
        userType: formData.user_type,
        formData,
      },
    });
  };

  // ========== FORM HANDLING FUNCTIONS ==========

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, JPG, PNG, WebP)');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setFormData(prev => ({
      ...prev,
      property_image: file,
    }));

    if (formErrors.property_image) {
      setFormErrors(prev => ({
        ...prev,
        property_image: undefined
      }));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setFormData(prev => ({
      ...prev,
      property_image: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ========== API FUNCTIONS ==========

  const handleSubmitPropertyRequest = useCallback(async () => {
    console.log("🔍 Submitting property request...");

    if (!isLoggedIn) {
      console.log("❌ User not logged in");
      setShowLoginPrompt(true);
      return;
    }

    if (!validateStep1()) {
      toast.error("Please fix the errors in the form");
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
        property_image_url: "",
        user_type: formData.user_type,
        step_tracking: {
          current_step: formData.current_step,
          step_status: formData.step_status
        }
      };

      const requestBody = {
        property_data: propertyData,
        notes: `User type: ${formData.user_type}. Step ${formData.current_step} completed.`
      };

      // Submit property request
      const response = await apiCall('CREATE_PROPERTY_REQUEST', {}, {
        data: requestBody
      });

      if (response.success) {
        toast.success(response.message || "Property request submitted successfully!");

        const requestId = response.data?.request_id;
        console.log("✅ Property request created, ID:", requestId);

        if (!requestId) {
          console.error("❌ No request_id in response:", response);
          toast.error("Server error: No request ID returned");
          return;
        }

        // Upload image if exists
        if (formData.property_image && requestId) {
          try {
            console.log("📤 Uploading property image...");
            const formDataToSend = new FormData();
            formDataToSend.append("image", formData.property_image);

            await apiCall('UPLOAD_PROPERTY_IMAGE', { id: requestId }, {
              data: formDataToSend
            });

            console.log("✅ Image uploaded successfully");
          } catch (imageError) {
            console.warn("Image upload failed, continuing without image:", imageError);
          }
        }

        // Update form data with request ID
        setFormData(prev => ({
          ...prev,
          request_id: requestId,
          ...propertyData
        }));

        setActiveStep(2);
        await fetchBrokers();

      } else {
        throw new Error(response.message || "Failed to submit property request");
      }

    } catch (error) {
      console.error("❌ Error submitting property request:", error);

      // Handle auth errors
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        setUser(null);
        toast.error("Session expired. Please login again.");
        navigate("/login-register");
        return;
      }

      toast.error(error.message || "Failed to submit property request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, formData, navigate]);

  const fetchBrokers = async () => {
    try {
      setLoadingBrokers(true);
      console.log("🔍 Fetching brokers from user service (port 5000)...");

      // Try the main endpoint on port 5000
      try {
        // Use directApiCall for simplicity
        const response = await fetch('http://localhost:5000/api/brokers', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
          mode: 'cors',
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const responseData = await response.json();
        console.log('✅ Raw brokers response:', responseData);

        let brokersData = [];

        // Handle the exact response format from your backend
        if (responseData && responseData.success === true && responseData.brokers && Array.isArray(responseData.brokers)) {
          brokersData = responseData.brokers;
          console.log(`✅ Found ${brokersData.length} brokers in responseData.brokers`);
        } else if (responseData && Array.isArray(responseData)) {
          brokersData = responseData;
          console.log(`✅ Found ${brokersData.length} brokers in responseData`);
        } else {
          console.log('❌ Unexpected response format:', responseData);
        }

        // Parse specialization and other stringified fields
        const parsedBrokers = brokersData.map(broker => {
          // Parse specialization if it's a stringified array
          let specialization = [];
          if (broker.specialization) {
            try {
              if (typeof broker.specialization === 'string') {
                specialization = JSON.parse(broker.specialization);
              } else if (Array.isArray(broker.specialization)) {
                specialization = broker.specialization;
              }
            } catch (e) {
              console.warn('Failed to parse specialization:', broker.specialization);
              specialization = broker.specialization.split(',').map(s => s.trim());
            }
          }

          // Parse languages
          let languages = [];
          if (broker.languages) {
            try {
              if (typeof broker.languages === 'string') {
                languages = JSON.parse(broker.languages);
              } else if (Array.isArray(broker.languages)) {
                languages = broker.languages;
              }
            } catch (e) {
              console.warn('Failed to parse languages:', broker.languages);
              languages = broker.languages.split(',').map(s => s.trim());
            }
          }

          // Parse service_areas
          let service_areas = [];
          if (broker.service_areas) {
            try {
              if (typeof broker.service_areas === 'string') {
                service_areas = JSON.parse(broker.service_areas);
              } else if (Array.isArray(broker.service_areas)) {
                service_areas = broker.service_areas;
              }
            } catch (e) {
              console.warn('Failed to parse service_areas:', broker.service_areas);
              service_areas = broker.service_areas.split(',').map(s => s.trim());
            }
          }

          return {
            ...broker,
            specialization: specialization,
            languages: languages,
            service_areas: service_areas,
            // Ensure these are properly typed
            is_available: Boolean(broker.is_available),
            is_verified: Boolean(broker.is_verified),
            // Add fallback values
            average_rating: parseFloat(broker.rating || broker.average_rating || 4.5),
            total_completed_deals: broker.completed_deals || broker.total_completed_deals || 0,
            commission_rate: broker.commission_rate || '2.5%',
            // Ensure name field exists
            name: broker.name || `${broker.first_name || ''} ${broker.last_name || ''}`.trim() || 'Broker',
            // Add profile picture fallback
            profile_picture: broker.profile_picture || null
          };
        });

        console.log(`✅ Parsed ${parsedBrokers.length} brokers:`, parsedBrokers);
        setBrokers(parsedBrokers);
        return;

      } catch (error5000) {
        console.error("❌ Error fetching from port 5000:", error5000.message);
      }

      // If we reach here, port 5000 failed
      console.log("⚠️ Trying alternative endpoints...");

      // Try other endpoints
      const endpoints = [
        'http://localhost:5000/api/users/brokers',
        'http://localhost:5000/api/users?role=broker',
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors',
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log(`✅ Response from ${endpoint}:`, responseData);

            let brokersData = [];

            // Handle different response formats
            if (responseData && Array.isArray(responseData)) {
              brokersData = responseData;
            } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
              brokersData = responseData.data;
            } else if (responseData && responseData.users && Array.isArray(responseData.users)) {
              brokersData = responseData.users.filter(user =>
                user.role === 'broker' ||
                user.role === 'internal_broker' ||
                user.role === 'external_broker'
              );
            } else if (responseData && responseData.brokers && Array.isArray(responseData.brokers)) {
              brokersData = responseData.brokers;
            }

            if (brokersData.length > 0) {
              console.log(`✅ Found ${brokersData.length} brokers from ${endpoint}`);
              setBrokers(brokersData);
              return;
            }
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, error.message);
        }
      }

      console.log("⚠️ No brokers found. All endpoints failed.");
      setBrokers([]);
      toast("No brokers available at the moment. Please try again later.");

    } catch (error) {
      console.error("❌ Error in fetchBrokers:", error);
      setBrokers([]);
      toast.error("Failed to load brokers. Please try again later.");
    } finally {
      setLoadingBrokers(false);
    }
  };

  const handleBrokerSelect = (broker) => {
    setSelectedBroker(broker);
    setFormData(prev => ({
      ...prev,
      selected_broker_id: broker.id
    }));
    toast.success(`Selected broker: ${broker.name || `${broker.first_name} ${broker.last_name}`}`);
  };

  const handleViewBrokerProfile = (broker) => {
    setSelectedBrokerForProfile(broker);
    setShowBrokerProfile(true);
  };

  const handleConfirmBrokerSelection = async () => {
    if (!selectedBroker) {
      toast.error("Please select a broker first");
      return;
    }

    if (!formData.request_id) {
      toast.error("Property request not found. Please submit property details first.");
      return;
    }

    try {
      setIsLoading(true);

      console.log("🔍 Assigning broker:", {
        requestId: formData.request_id,
        brokerId: selectedBroker.id
      });

      const response = await apiCall('ASSIGN_BROKER', { id: formData.request_id }, {
        data: {
          brokerId: selectedBroker.id
        }
      });

      if (response.success) {
        setActiveStep(3);
        toast.success(response.message || "Broker assigned successfully!");

        setFormData(prev => ({
          ...prev,
          assigned_broker_id: selectedBroker.id,
          status: 'assigned',
          selected_broker_id: selectedBroker.id
        }));

      } else {
        throw new Error(response.message || "Failed to assign broker");
      }
    } catch (error) {
      console.error("❌ Error assigning broker:", error);
      toast.error(error.message || "Failed to assign broker");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChatWithBroker = () => {
    if (selectedBroker) {
      navigate("/chat", {
        state: {
          preselectedUser: {
            id: selectedBroker.id,
            fullName: selectedBroker.name || `${selectedBroker.first_name} ${selectedBroker.last_name}`,
            userType: "broker",
            profile_picture: selectedBroker.profile_picture,
          },
        },
      });
    } else {
      toast.error("No broker selected");
    }
  };

  useEffect(() => {
    if (activeStep === 2 && isLoggedIn && brokers.length === 0) {
      fetchBrokers();
    }
  }, [activeStep, isLoggedIn, brokers.length]);

  // ========== UI HELPER FUNCTIONS ==========

  const renderBackButton = () => {
    if (activeStep === 1) return null;

    return (
      <button
        onClick={handleGoBack}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${theme === "dark"
          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>
    );
  };

  // ========== STEP CONTENT COMPONENT ==========

  const StepContent = React.useMemo(() => {
    const renderStepHeader = (title, description = null) => (
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h3
            className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
              }`}
          >
            {title}
          </h3>
          {description && (
            <p
              className={`mt-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
            >
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">{renderBackButton()}</div>
      </div>
    );

    const renderError = (field) => {
      if (formErrors[field]) {
        return (
          <p className="text-red-500 text-sm mt-1">{formErrors[field]}</p>
        );
      }
      return null;
    };

    switch (activeStep) {
      case 1:
        return (
          <div
            className={`p-8 rounded-xl border-2 ${theme === "dark"
              ? "bg-gray-800/50 border-amber-400/30"
              : "bg-white border-amber-200"
              } backdrop-blur-sm`}
          >
            {renderStepHeader(
              `Tell Us About Your ${formData.user_type === "seller" ? "Property" : "Rental"
              }`
            )}

            <div className="mb-8">
              <label
                className={`block text-sm font-medium mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                Property Photo (Best Shot) *
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${theme === "dark"
                  ? "border-gray-600 hover:border-amber-400 bg-gray-700/30"
                  : "border-gray-300 hover:border-amber-400 bg-gray-50"
                  } ${imagePreview ? "border-amber-400" : ""} ${formErrors.property_image ? "border-red-500" : ""
                  }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto max-w-md">
                      <img
                        src={imagePreview}
                        alt="Property preview"
                        className="w-full h-64 object-cover rounded-lg shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p
                      className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                    >
                      Click to change image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                      <Camera className="w-10 h-10 text-amber-600" />
                    </div>
                    <div>
                      <p
                        className={`font-medium mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                      >
                        Upload your property's best photo
                      </p>
                      <p
                        className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}
                      >
                        Recommended: High-quality image that shows the property at its best
                        <br />
                        Max size: 10MB • Formats: JPG, PNG, WebP
                      </p>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="property-image-upload"
                />
                <label
                  htmlFor="property-image-upload"
                  className={`inline-block mt-4 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-300 ${theme === "dark"
                    ? "bg-amber-500 hover:bg-amber-600 text-black"
                    : "bg-amber-400 hover:bg-amber-500 text-black"
                    }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {imagePreview ? "Change Photo" : "Choose Photo"}
                </label>
              </div>
              {renderError("property_image")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                >
                  Property Type *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) =>
                    handleInputChange("property_type", e.target.value)
                  }
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white hover:border-amber-400"
                    : "bg-white border-gray-300 text-gray-900 hover:border-amber-400"
                    } ${formErrors.property_type ? "border-red-500" : ""}`}
                >
                  <option value="">Select Property Type</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="condo">Condo</option>
                  <option value="commercial">Commercial</option>
                  <option value="land">Land</option>
                  <option value="other">Other</option>
                </select>
                {renderError("property_type")}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                >
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
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
                <label
                  className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                >
                  {formData.user_type === "seller"
                    ? "Expected Price (ETB) *"
                    : "Monthly Rent (ETB) *"}
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

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                >
                  Preferred Verification *
                </label>
                <select
                  value={formData.verification_method}
                  onChange={(e) =>
                    handleInputChange("verification_method", e.target.value)
                  }
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white hover:border-amber-400"
                    : "bg-white border-gray-300 text-gray-900 hover:border-amber-400"
                    } ${formErrors.verification_method ? "border-red-500" : ""}`}
                >
                  <option value="">Select Verification Method</option>
                  <option value="physical">Physical Visit</option>
                  <option value="video">Video Call</option>
                  <option value="documents">Document Upload</option>
                  <option value="mixed">Mixed (Physical + Documents)</option>
                </select>
                {renderError("verification_method")}
              </div>
            </div>

            <div className="mb-6">
              <label
                className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                Property Description
              </label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Briefly describe your property features, amenities, and any special details..."
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                  }`}
              />
            </div>

            <div className="flex space-x-4">
              {renderBackButton()}
              <button
                onClick={handleSubmitPropertyRequest}
                disabled={isLoading}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  "Continue to Broker Selection"
                )}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div
            className={`p-8 rounded-xl border-2 ${theme === "dark"
              ? "bg-gray-800/50 border-amber-400/30"
              : "bg-white border-amber-200"
              } backdrop-blur-sm`}
          >
            {renderStepHeader(
              "Choose Your Verified Broker",
              `Select from our network of trusted brokers specializing in ${formData.user_type === "seller" ? "property sales" : "rental properties"
              }.`
            )}

            {selectedBroker && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleConfirmBrokerSelection}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Assigning..." : "Confirm Selection & Continue"}
                </button>
              </div>
            )}

            {loadingBrokers ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
                <span className="ml-4 text-gray-600 dark:text-gray-300">
                  Loading available brokers...
                </span>
              </div>
            ) : brokers.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {brokers.map((broker) => (
                  <div
                    key={broker.id || broker._id || broker.userId}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${selectedBroker?.id === broker.id
                      ? "border-amber-400 bg-amber-400/10"
                      : theme === "dark"
                        ? "bg-gray-700/50 border-gray-600 hover:border-amber-400"
                        : "bg-white border-gray-200 hover:border-amber-400"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center overflow-hidden">
                            {broker.profile_picture || broker.profilePicture ? (
                              <img
                                src={broker.profile_picture || broker.profilePicture}
                                alt={broker.name || broker.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-8 h-8 text-black" />
                            )}
                          </div>
                          {broker.is_verified && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <ShieldCheck className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4
                              className={`font-semibold text-lg ${theme === "dark"
                                ? "text-white"
                                : "text-gray-900"
                                }`}
                            >
                              {broker.name || broker.fullName || `${broker.first_name} ${broker.last_name}`}
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${broker.broker_type === "internal"
                                ? "bg-blue-500 text-white"
                                : "bg-green-500 text-white"
                                }`}
                            >
                              {broker.broker_type === "internal"
                                ? "Internal"
                                : "External"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-amber-400 fill-current" />
                              <span className="text-sm ml-1">
                                {broker.average_rating || broker.rating || "4.5"}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {broker.total_completed_deals || broker.completedDeals || 0} deals
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {broker.years_experience || broker.experience || "2+"} years
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {broker.specialization && (
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(broker.specialization)
                            ? broker.specialization
                            : [broker.specialization]
                          ).slice(0, 3).map((spec, index) => (
                            <span
                              key={index}
                              className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}

                      {(broker.bio || broker.description) && (
                        <p
                          className={`text-sm line-clamp-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                            }`}
                        >
                          {broker.bio || broker.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p
                          className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                            }`}
                        >
                          Commission Rate
                        </p>
                        <p className="text-lg font-bold text-amber-400">
                          {broker.commission_rate || broker.commission || "2.5"}%
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewBrokerProfile(broker)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === "dark"
                            ? "bg-gray-600 hover:bg-gray-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }`}
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleBrokerSelect(broker)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedBroker?.id === broker.id
                            ? "bg-amber-500 text-white"
                            : "bg-amber-400 hover:bg-amber-500 text-black"
                            }`}
                        >
                          {selectedBroker?.id === broker.id
                            ? "Selected"
                            : "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  No brokers are currently available. Please try again later.
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div
            className={`p-8 rounded-xl border-2 ${theme === "dark"
              ? "bg-gray-800/50 border-amber-400/30"
              : "bg-white border-amber-200"
              } backdrop-blur-sm`}
          >
            {renderStepHeader("Property Verification Scheduled")}

            <div className="text-center mb-8">
              <ShieldCheck className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <p
                className={`text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                {selectedBroker
                  ? `Your broker ${selectedBroker.name || selectedBroker.fullName} will contact you within 24 hours to schedule the verification appointment.`
                  : "Your broker will contact you within 24 hours to schedule the verification appointment."}
              </p>
            </div>

            <div
              className={`p-6 rounded-lg mb-6 ${theme === "dark"
                ? "bg-blue-900/20 border border-blue-700"
                : "bg-blue-50 border border-blue-200"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4
                    className={`font-semibold mb-2 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                  >
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    Need to communicate with your broker?
                  </h4>
                  <p
                    className={`text-sm ${theme === "dark" ? "text-blue-300" : "text-blue-700"
                      }`}
                  >
                    Use our secure chat platform to discuss details with{" "}
                    {selectedBroker?.name || selectedBroker?.fullName || "your broker"}
                  </p>
                </div>
                <button
                  onClick={handleOpenChatWithBroker}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Open Chat
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-amber-50"
                } mb-6`}
            >
              <h4
                className={`font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
              >
                What to expect during verification:
              </h4>
              <ul
                className={`space-y-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                <li className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                  Ownership document verification
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                  Property condition assessment
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                  Photo and video documentation
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                  Location verification
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                  Market value estimation
                </li>
              </ul>
            </div>

            <div className="flex space-x-4">
              {renderBackButton()}
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300"
              >
                Continue to Next Step
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div
            className={`p-8 rounded-xl border-2 ${theme === "dark"
              ? "bg-gray-800/50 border-amber-400/30"
              : "bg-white border-amber-200"
              } backdrop-blur-sm`}
          >
            {renderStepHeader(
              currentSteps.find((s) => s.number === activeStep)?.title
            )}

            <p
              className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
            >
              {currentSteps.find((s) => s.number === activeStep)?.description}
            </p>

            <div
              className={`p-4 rounded-lg mb-6 ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
                }`}
            >
              <p
                className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                This step will be completed with your selected broker. You'll
                receive notifications for appointments and updates.
              </p>
            </div>

            <div className="flex space-x-4">
              {renderBackButton()}
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300"
              >
                Continue
              </button>
            </div>
          </div>
        );
    }
  }, [
    activeStep,
    theme,
    formData,
    brokers,
    loadingBrokers,
    currentSteps,
    isLoading,
    selectedBroker,
    formErrors,
    imagePreview,
    handleSubmitPropertyRequest,
    handleImageUpload,
    handleRemoveImage,
    handleConfirmBrokerSelection,
    handleOpenChatWithBroker,
  ]);

  // ========== PROGRESS CIRCLE COMPONENT ==========

  const ProgressCircle = ({ step, isActive, isCompleted, onClick }) => {
    const IconComponent = step.icon;

    return (
      <div
        className={`relative flex flex-col items-center cursor-pointer transition-all duration-500 group ${isActive ? "scale-110" : "scale-100"
          } ${isCompleted || isActive ? "cursor-pointer" : "cursor-pointer"}`}
        onClick={() => onClick(step.number)}
        title={`${step.title}: ${step.description}`}
      >
        {step.number > 1 && (
          <div
            className={`absolute -left-16 top-6 w-16 h-0.5 transition-all duration-500 ${isCompleted || isActive
              ? "bg-amber-400"
              : "bg-gray-300 dark:bg-gray-600 group-hover:bg-amber-300"
              }`}
          />
        )}

        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-500 group-hover:border-amber-400 ${isCompleted
            ? "bg-amber-400 border-amber-400 text-white shadow-lg"
            : isActive
              ? "border-amber-400 bg-amber-400 text-white shadow-lg"
              : "border-gray-300 dark:border-gray-600 bg-transparent text-gray-400 dark:text-gray-500 group-hover:text-amber-400"
            }`}
        >
          {isCompleted ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <IconComponent className="w-8 h-8" />
          )}
        </div>

        <div
          className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${isCompleted || isActive
            ? "bg-amber-600 text-white shadow-lg"
            : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 group-hover:bg-amber-500 group-hover:text-white"
            }`}
        >
          {step.number}
        </div>

        <div className="mt-4 text-center max-w-[140px]">
          <h3
            className={`text-sm font-semibold mb-1 transition-colors duration-300 ${isActive || isCompleted
              ? "text-amber-400 dark:text-amber-300"
              : "text-gray-600 dark:text-gray-400 group-hover:text-amber-400"
              }`}
          >
            {step.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
            {step.description}
          </p>
        </div>
      </div>
    );
  };

  // ========== MAIN RENDER ==========

  return (
    <div
      className={`min-h-screen ${theme === "dark"
        ? "bg-gradient-to-br from-gray-900 via-black to-gray-800"
        : "bg-gradient-to-br from-amber-50 via-white to-gray-100"
        } relative overflow-x-hidden`}
    >
      {isLoading && <Loader theme={theme} />}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <div
        className="relative h-[600px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/imgs/userHouse3.jpg')`,
        }}
      >
        <header className="relative w-full max-w-[1580px] mx-auto px-4 sm:px-6 transition-all duration-500 z-10">
          <div className="w-full">
            <div className="NavBar flex flex-col sm:flex-row items-center justify-between py-4 sm:py-6">
              <img
                src="/vectors/LogoY.svg"
                alt="Logo"
                className="logoTop relative top-8 left-5"
              />
              <nav className="w-full sm:w-auto flex-wrap">
                <ul
                  className={`flex flex-wrap justify-center relative space-x-4 sm:space-x-6 md:space-x-16 lg:space-x-28 sm:-left-52 md:-left-80 lg:-left-12 ${theme === "dark" ? "text-white" : "text-black"
                    }`}
                >
                  <li>
                    <a href="/properties" className="nav-link">
                      Property
                    </a>
                  </li>
                  <li>
                    <a href="#" className="nav-link">
                      Help
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("AboutUs")}
                      className="nav-link"
                    >
                      About Us
                    </button>
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
                          onLogout={handleLogout}
                          onUploadImage={() => setShowProfileModal(true)}
                          onUsernameChange={handleUsernameChange}
                        />
                        <span
                          className={
                            theme === "dark" ? "text-white" : "text-black"
                          }
                        >
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                    ) : (
                      <Link to="/login-register" className="nav-link">
                        Sign In
                      </Link>
                    )}
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>

        <div className="absolute inset-0 flex items-center justify-center pt-16">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span
                ref={typingRef}
                className="border-r-2 border-white pr-1 typing-cursor"
              >
                {typingText}
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {formData.user_type === "seller"
                ? "Streamlined selling process with verified brokers"
                : "Easy rental management with trusted professionals"}
            </p>
            <div className="animate-bounce mt-8">
              <ChevronDown className="w-8 h-8 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative -mt-20">
        <div className="container mx-auto px-4 relative z-10">
          <div
            className={`p-6 rounded-xl shadow-lg max-w-2xl mx-auto ${theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
          >
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setUserType("seller");
                  setFormData(prev => ({ ...prev, user_type: "seller" }));
                }}
                className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${formData.user_type === "seller"
                  ? "bg-amber-400 text-black shadow-lg"
                  : theme === "dark"
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                Sell Property
              </button>
              <button
                onClick={() => {
                  setUserType("leaser");
                  setFormData(prev => ({ ...prev, user_type: "leaser" }));
                }}
                className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${formData.user_type === "leaser"
                  ? "bg-amber-400 text-black shadow-lg"
                  : theme === "dark"
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                Rent Out Property
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-16 relative">
              {currentSteps.map((step) => (
                <ProgressCircle
                  key={step.number}
                  step={step}
                  isActive={step.number === activeStep}
                  isCompleted={step.number < activeStep}
                  onClick={handleStepClick}
                />
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">{StepContent}</div>
        </div>

        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`p-8 rounded-xl max-w-md w-full ${theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}
            >
              <h3
                className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
              >
                Login Required
              </h3>
              <p
                className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                To continue with broker selection and property verification,
                please login to your account.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleContinueWithoutLogin}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold ${theme === "dark"
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                  Continue Later
                </button>
                <button
                  onClick={handleLoginRedirect}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Login Now
                </button>
              </div>
            </div>
          </div>
        )}

        <FloatingElements theme={theme} />

        <ProfilePictureModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpload={handleProfilePictureUpload}
          userProfilePicture={user?.profile_picture}
          theme={theme}
          firstName={user?.first_name}
          lastName={user?.last_name}
          role={user?.role}
        />

        {showBrokerProfile && selectedBrokerForProfile && (
          <BrokerProfileModal
            broker={selectedBrokerForProfile}
            isOpen={showBrokerProfile}
            onClose={() => setShowBrokerProfile(false)}
            onSelect={() => {
              setSelectedBroker(selectedBrokerForProfile);
              setShowBrokerProfile(false);
            }}
            theme={theme}
          />
        )}

        <Footer />
      </div>
    </div>
  );
};

export default SellerLeaser;