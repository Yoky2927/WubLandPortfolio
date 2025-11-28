// frontend/src/pages/public/SellerLeaser.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
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
  Image, // Add this import
  X, // Add this import
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
    propertyType: "",
    location: "",
    price: "",
    verificationMethod: "",
    description: "",
    propertyImage: "", // Add this line
  });
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [loadingBrokers, setLoadingBrokers] = useState(true);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showBrokerProfile, setShowBrokerProfile] = useState(false);
  const [selectedBrokerForProfile, setSelectedBrokerForProfile] =
    useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const typingRef = useRef(null);

  // Handle userType from navigation state
  useEffect(() => {
    if (location.state?.userType) {
      setUserType(location.state.userType);
    }
  }, [location.state]);

  // Typing animation
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

  // Check if user is logged in and get user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const loggedIn = !!(token || userData.role);

    setIsLoggedIn(loggedIn);
    setUser(userData);

    if (
      loggedIn &&
      (userData.role === "seller" || userData.role === "leaser")
    ) {
      setActiveStep(2);
    }
  }, []);

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

  const handleStepClick = (stepNumber) => {
    const step = currentSteps.find((s) => s.number === stepNumber);

    if (step.requiresLogin && !isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    // Allow going back to previous steps, but restrict going too far ahead
    if (stepNumber <= activeStep + 1 || stepNumber < activeStep) {
      setActiveStep(stepNumber);
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
        userType,
        formData,
      },
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitPropertyRequest = useCallback(async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/property/request-listing",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            userType,
            status: "draft",
          }),
        }
      );

      if (response.ok) {
        setActiveStep(2);
        toast.success("Property details submitted successfully!");
      } else {
        throw new Error("Failed to submit property request");
      }
    } catch (error) {
      console.error("Error submitting property request:", error);
      toast.error("Failed to submit property request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, formData, userType]);

  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/auth/upload-profile-picture",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const updatedUser = {
          ...user,
          profile_picture: data.profilePictureUrl || data.imageUrl,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setShowProfileModal(false);
        toast.success("Profile picture updated successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }
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

  // Fetch brokers data from API
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/brokers");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.brokers) {
          const parsedBrokers = data.brokers.map((broker) => ({
            ...broker,
            specialization:
              typeof broker.specialization === "string"
                ? JSON.parse(broker.specialization)
                : broker.specialization,
            languages:
              typeof broker.languages === "string"
                ? JSON.parse(broker.languages)
                : broker.languages,
            service_areas:
              typeof broker.service_areas === "string"
                ? JSON.parse(broker.service_areas)
                : broker.service_areas,
            is_available: Boolean(broker.is_available),
            is_verified: Boolean(broker.is_verified),
          }));

          setBrokers(parsedBrokers);
        } else {
          setBrokers([]);
        }
      } catch (error) {
        console.error("Error fetching brokers:", error);
        toast.error("Failed to load brokers");
        setBrokers([]);
      } finally {
        setLoadingBrokers(false);
      }
    };

    fetchBrokers();
  }, []);

  const handleBrokerSelect = (broker) => {
    setSelectedBroker(broker);
    toast.success(`Selected broker: ${broker.name}`);
  };

  const handleViewBrokerProfile = (broker) => {
    setSelectedBrokerForProfile(broker);
    setShowBrokerProfile(true);
  };

  const handleConfirmBrokerSelection = () => {
    if (selectedBroker) {
      setActiveStep(3);
      toast.success(`Broker ${selectedBroker.name} confirmed!`);
    } else {
      toast.error("Please select a broker first");
    }
  };

  const handleOpenChatWithBroker = () => {
    if (selectedBroker) {
      // Navigate to chat app with the selected broker
      navigate("/chat", {
        state: {
          preselectedUser: {
            id: selectedBroker.id,
            fullName: selectedBroker.name,
            userType: "broker",
            profile_picture: selectedBroker.profile_picture,
          },
        },
      });
    } else {
      toast.error("No broker selected");
    }
  };

  // Render back button for steps that need it
  const renderBackButton = () => {
    if (activeStep === 1) return null;

    return (
      <button
        onClick={handleGoBack}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
          theme === "dark"
            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>
    );
  };

  const StepContent = React.useMemo(() => {
    const renderStepHeader = (title, description = null) => (
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h3
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h3>
          {description && (
            <p
              className={`mt-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">{renderBackButton()}</div>
      </div>
    );

    const renderActionButtons = (
      showContinue = true,
      continueText = "Continue to Next Step",
      showBack = true
    ) => (
      <div className="flex space-x-4">
        {showBack && renderBackButton()}
        {showContinue && (
          <button
            onClick={() => setActiveStep(activeStep + 1)}
            className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300"
          >
            {continueText}
          </button>
        )}
      </div>
    );

    switch (activeStep) {
      case 1:
        return (
          <div
            className={`p-8 rounded-xl border-2 ${
              theme === "dark"
                ? "bg-gray-800/50 border-amber-400/30"
                : "bg-white border-amber-200"
            } backdrop-blur-sm`}
          >
            {renderStepHeader(
              `Tell Us About Your ${
                userType === "seller" ? "Property" : "Rental"
              }`
            )}

            {/* Property Image Upload Section */}
            <div className="mb-8">
              <label
                className={`block text-sm font-medium mb-4 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Property Photo (Best Shot)
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  theme === "dark"
                    ? "border-gray-600 hover:border-amber-400 bg-gray-700/30"
                    : "border-gray-300 hover:border-amber-400 bg-gray-50"
                } ${formData.propertyImage ? "border-amber-400" : ""}`}
              >
                {formData.propertyImage ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto max-w-md">
                      <img
                        src={formData.propertyImage}
                        alt="Property preview"
                        className="w-full h-64 object-cover rounded-lg shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange("propertyImage", "")}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Image selected. Click to change.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                      <Image className="w-10 h-10 text-amber-600" />
                    </div>
                    <div>
                      <p
                        className={`font-medium mb-2 ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Upload your property's best photo
                      </p>
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Recommended: High-quality image that shows the property
                        at its best
                      </p>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleInputChange("propertyImage", reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="property-image-upload"
                />
                <label
                  htmlFor="property-image-upload"
                  className={`inline-block mt-4 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-amber-500 hover:bg-amber-600 text-black"
                      : "bg-amber-400 hover:bg-amber-500 text-black"
                  }`}
                >
                  {formData.propertyImage ? "Change Photo" : "Choose Photo"}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Property Type
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) =>
                    handleInputChange("propertyType", e.target.value)
                  }
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white hover:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 hover:border-amber-400"
                  }`}
                >
                  <option value="">Select Property Type</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="condo">Condo</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="Enter sub-city or woreda"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {userType === "seller"
                    ? "Expected Price (ETB)"
                    : "Monthly Rent (ETB)"}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="Enter amount"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Preferred Verification
                </label>
                <select
                  value={formData.verificationMethod}
                  onChange={(e) =>
                    handleInputChange("verificationMethod", e.target.value)
                  }
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white hover:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 hover:border-amber-400"
                  }`}
                >
                  <option value="">Select Verification Method</option>
                  <option value="physical">Physical Visit</option>
                  <option value="video">Video Call</option>
                  <option value="documents">Document Upload</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
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
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-amber-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-amber-400"
                }`}
              />
            </div>

            <div className="flex space-x-4">
              {renderBackButton()}
              <button
                onClick={handleSubmitPropertyRequest}
                disabled={isLoading || !formData.propertyImage}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Submitting..." : "Continue to Broker Selection"}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div
            className={`p-8 rounded-xl border-2 ${
              theme === "dark"
                ? "bg-gray-800/50 border-amber-400/30"
                : "bg-white border-amber-200"
            } backdrop-blur-sm`}
          >
            {renderStepHeader(
              "Choose Your Verified Broker",
              `Select from our network of trusted brokers specializing in ${
                userType === "seller" ? "property sales" : "rental properties"
              }.`
            )}

            {selectedBroker && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleConfirmBrokerSelection}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  Confirm Selection & Continue
                </button>
              </div>
            )}

            {loadingBrokers ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
                <span className="ml-4 text-gray-600 dark:text-gray-300">
                  Loading brokers...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {brokers.map((broker) => (
                  <div
                    key={broker.id}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      selectedBroker?.id === broker.id
                        ? "border-amber-400 bg-amber-400/10"
                        : theme === "dark"
                        ? "bg-gray-700/50 border-gray-600 hover:border-amber-400"
                        : "bg-white border-gray-200 hover:border-amber-400"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center">
                            {broker.profile_picture ? (
                              <img
                                src={broker.profile_picture}
                                alt={broker.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="w-8 h-8 text-black" />
                            )}
                          </div>
                          {broker.is_verified && (
                            <ShieldCheck className="absolute -top-1 -right-1 w-6 h-6 text-green-500 bg-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4
                              className={`font-semibold text-lg ${
                                theme === "dark"
                                  ? "text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {broker.name}
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                broker.broker_type === "internal"
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
                                {broker.rating}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {broker.completed_deals} deals
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {broker.years_experience} years
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(broker.specialization) &&
                          broker.specialization
                            .slice(0, 3)
                            .map((spec, index) => (
                              <span
                                key={index}
                                className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full"
                              >
                                {spec}
                              </span>
                            ))}
                      </div>

                      {broker.bio && (
                        <p
                          className={`text-sm line-clamp-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {broker.bio}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p
                          className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Commission
                        </p>
                        <p className="text-lg font-bold text-amber-400">
                          {broker.commission_rate}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewBrokerProfile(broker)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            theme === "dark"
                              ? "bg-gray-600 hover:bg-gray-500 text-white"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                          }`}
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleBrokerSelect(broker)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedBroker?.id === broker.id
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
            )}

            {brokers.length === 0 && !loadingBrokers && (
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
            className={`p-8 rounded-xl border-2 ${
              theme === "dark"
                ? "bg-gray-800/50 border-amber-400/30"
                : "bg-white border-amber-200"
            } backdrop-blur-sm`}
          >
            {renderStepHeader("Property Verification Scheduled")}

            <div className="text-center mb-8">
              <ShieldCheck className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <p
                className={`text-lg ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Your broker {selectedBroker?.name} will contact you within 24
                hours to schedule the verification appointment.
              </p>
            </div>

            {/* Chat App Integration */}
            <div
              className={`p-6 rounded-lg mb-6 ${
                theme === "dark"
                  ? "bg-blue-900/20 border border-blue-700"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4
                    className={`font-semibold mb-2 flex items-center gap-2 ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    Need to communicate with your broker?
                  </h4>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    Use our secure chat platform to discuss details with{" "}
                    {selectedBroker?.name}
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
              className={`p-6 rounded-lg ${
                theme === "dark" ? "bg-gray-700/50" : "bg-amber-50"
              } mb-6`}
            >
              <h4
                className={`font-semibold mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                What to expect during verification:
              </h4>
              <ul
                className={`space-y-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
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

            {renderActionButtons(true, "Continue to Next Step", true)}
          </div>
        );

      default:
        return (
          <div
            className={`p-8 rounded-xl border-2 ${
              theme === "dark"
                ? "bg-gray-800/50 border-amber-400/30"
                : "bg-white border-amber-200"
            } backdrop-blur-sm`}
          >
            {renderStepHeader(
              currentSteps.find((s) => s.number === activeStep)?.title
            )}

            <p
              className={`mb-6 ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {currentSteps.find((s) => s.number === activeStep)?.description}
            </p>

            <div
              className={`p-4 rounded-lg mb-6 ${
                theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
              }`}
            >
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                This step will be completed with your selected broker. You'll
                receive notifications for appointments and updates.
              </p>
            </div>

            {renderActionButtons(true, "Continue", true)}
          </div>
        );
    }
  }, [
    activeStep,
    theme,
    userType,
    formData,
    brokers,
    loadingBrokers,
    currentSteps,
    handleSubmitPropertyRequest,
    isLoading,
    selectedBroker,
  ]);
  const ProgressCircle = ({ step, isActive, isCompleted, onClick }) => {
    const IconComponent = step.icon;

    return (
      <div
        className={`relative flex flex-col items-center cursor-pointer transition-all duration-500 group ${
          isActive ? "scale-110" : "scale-100"
        } ${isCompleted || isActive ? "cursor-pointer" : "cursor-pointer"}`}
        onClick={() => onClick(step.number)}
        title={`${step.title}: ${step.description}`}
      >
        {step.number > 1 && (
          <div
            className={`absolute -left-16 top-6 w-16 h-0.5 transition-all duration-500 ${
              isCompleted || isActive
                ? "bg-amber-400"
                : "bg-gray-300 dark:bg-gray-600 group-hover:bg-amber-300"
            }`}
          />
        )}

        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-500 group-hover:border-amber-400 ${
            isCompleted
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
          className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
            isCompleted || isActive
              ? "bg-amber-600 text-white shadow-lg"
              : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 group-hover:bg-amber-500 group-hover:text-white"
          }`}
        >
          {step.number}
        </div>

        <div className="mt-4 text-center max-w-[140px]">
          <h3
            className={`text-sm font-semibold mb-1 transition-colors duration-300 ${
              isActive || isCompleted
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

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-black to-gray-800"
          : "bg-gradient-to-br from-amber-50 via-white to-gray-100"
      } relative overflow-x-hidden`}
    >
      {isLoading && <Loader theme={theme} />}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* Hero Section */}
      <div
        className="relative h-[600px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/imgs/userHouse3.jpg')`,
        }}
      >
        {/* Navigation Bar */}
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
                  className={`flex flex-wrap justify-center relative space-x-4 sm:space-x-6 md:space-x-16 lg:space-x-28 sm:-left-52 md:-left-80 lg:-left-12 ${
                    theme === "dark" ? "text-white" : "text-black"
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

        {/* Hero Content */}
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
              {userType === "seller"
                ? "Streamlined selling process with verified brokers"
                : "Easy rental management with trusted professionals"}
            </p>
            <div className="animate-bounce mt-8">
              <ChevronDown className="w-8 h-8 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-20">
        {/* User Type Selector */}
        <div className="container mx-auto px-4 relative z-10">
          <div
            className={`p-6 rounded-xl shadow-lg max-w-2xl mx-auto ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex space-x-4">
              <button
                onClick={() => setUserType("seller")}
                className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  userType === "seller"
                    ? "bg-amber-400 text-black shadow-lg"
                    : theme === "dark"
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Sell Property
              </button>
              <button
                onClick={() => setUserType("leaser")}
                className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  userType === "leaser"
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

        {/* Progress Steps */}
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

          {/* Step Content */}
          <div className="max-w-4xl mx-auto">{StepContent}</div>
        </div>

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`p-8 rounded-xl max-w-md w-full ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h3
                className={`text-2xl font-bold mb-4 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Login Required
              </h3>
              <p
                className={`mb-6 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                To continue with broker selection and property verification,
                please login to your account.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleContinueWithoutLogin}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold ${
                    theme === "dark"
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

        {/* Floating Elements */}
        <FloatingElements theme={theme} />

        {/* Profile Picture Modal */}
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

        {/* Broker Profile Modal */}
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
