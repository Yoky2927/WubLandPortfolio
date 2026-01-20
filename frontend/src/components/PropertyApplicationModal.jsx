import React, { useState, useEffect } from "react";
import {
  X, FileText, User, Calendar, Home, Building, DollarSign,
  MessageSquare, ChevronRight, Check, AlertCircle, ChevronDown,
  ChevronUp, MapPin, Users, Star, ShieldCheck, Loader,
  ArrowRight, CheckCircle, AlertTriangle, Clock, Info,Bell ,
  FileCheck, Handshake, Target
} from "lucide-react";
import { apiCall } from "../utils/api.endpoints";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-hot-toast";

const PropertyApplicationModal = ({ isOpen, onClose, property, userType, onSubmit, theme }) => {
  const { theme: currentTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    message: "",
    offered_amount: "",
    cover_letter: "",
    application_type: "rent",
    preferred_move_in_date: "",
    financing_preference: "",
    has_pets: false,
    additional_occupants: 0,
    special_requests: "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [applicationId, setApplicationId] = useState(null);

  const isDark = currentTheme === "dark";

  // Initialize form based on property and user type
  useEffect(() => {
    if (property) {
      setFormData(prev => ({
        ...prev,
        application_type: userType === "buyer" ? "sale" : "rent",
        offered_amount: property.price || "",
      }));
    }
  }, [property, userType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.message.trim()) {
      errors.message = "Please include a message to the property owner";
    }

    if (formData.application_type === "sale" && !formData.offered_amount) {
      errors.offered_amount = "Please enter your offer amount";
    }

    if (formData.offered_amount && parseFloat(formData.offered_amount) <= 0) {
      errors.offered_amount = "Offer amount must be greater than 0";
    }

    if (formData.preferred_move_in_date) {
      const moveInDate = new Date(formData.preferred_move_in_date);
      if (moveInDate < new Date()) {
        errors.preferred_move_in_date = "Move-in date cannot be in the past";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setCurrentStep(1);
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        property_id: property.id,
        message: formData.message,
        offered_amount: formData.offered_amount ? parseFloat(formData.offered_amount) : null,
        cover_letter: formData.cover_letter,
        application_type: formData.application_type,
        preferred_move_in_date: formData.preferred_move_in_date || null,
        financing_preference: formData.financing_preference || null,
        has_pets: formData.has_pets,
        additional_occupants: formData.additional_occupants || 0,
        special_requests: formData.special_requests || "",
        status: "submitted",
        submitted_at: new Date().toISOString()
      };

      console.log("🔍 SUBMITTING APPLICATION PAYLOAD:", payload);

      // ⚠️ CRITICAL: Wait for backend confirmation before showing success
      const response = await apiCall('CREATE_APPLICATION', {}, {
        method: 'POST',
        data: payload
      });

      console.log("✅ BACKEND RESPONSE RECEIVED:", response);

      // 🔒 VALIDATE BACKEND RESPONSE STRUCTURE
      if (!response) {
        throw new Error("No response received from server");
      }

      // Check different possible success response structures
      const isSuccess = (
        response.success === true ||
        response.id !== undefined ||
        response.application_id !== undefined ||
        (response.data && (response.data.id || response.data.application_id))
      );

      if (!isSuccess) {
        throw new Error(
          response.message ||
          response.error ||
          "Application submission failed. Please try again."
        );
      }

      // Extract application ID from different possible response formats
      const appId = response.id ||
        response.application_id ||
        (response.data && response.data.id) ||
        (response.data && response.data.application_id);

      // ⚠️ ONLY NOW mark as submitted (after backend confirmation)
      setApplicationId(appId);
      setIsSubmitted(true);

      toast.success("Application submitted successfully!");

      // If parent component has onSubmit callback, call it
      if (onSubmit) {
        await onSubmit(payload, response); // Pass response to parent
      }

    } catch (error) {
      console.error("❌ APPLICATION ERROR:", error);

      // Don't mark as submitted on error
      setIsSubmitted(false);
      setApplicationId(null);

      // Show appropriate error message
      if (error.message.includes("Network")) {
        toast.error("Network error. Please check your connection.");
      } else if (error.message.includes("401")) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (error.message.includes("500")) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(error.message || "Failed to submit application.");
      }

      // Optionally: Stay on step 3 so user can try again
      setCurrentStep(3);

    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden ${isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-800/30'
          : 'bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200'
          } border-2 transition-all duration-500 max-h-[95vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark
          ? 'border-amber-800/30 bg-gradient-to-r from-amber-900/20 via-amber-800/20 to-amber-900/20'
          : 'border-amber-200 bg-gradient-to-r from-amber-50/80 via-amber-100/50 to-amber-50/80'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isDark
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20'
                : 'bg-gradient-to-br from-amber-100 to-amber-200'
                }`}>
                <FileText className={`w-8 h-8 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isSubmitted ? 'Application Submitted!' : 'Property Application'}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Home className={`w-4 h-4 ${isDark ? 'text-amber-800' : 'text-amber-600'}`} />
                    <span className={`text-sm font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                      {property?.title?.substring(0, 30) || 'Property'}...
                    </span>
                  </div>
                  <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-amber-600' : 'bg-amber-800'}`} />
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className={`px-3 py-1 rounded-lg font-inter flex items-center gap-2 text-sm ${isDark
                      ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40 border border-amber-800/30'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
                      } transition-colors`}
                  >
                    {showDetails ? 'Hide' : 'Show'} Details
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-all duration-300 ${isDark
                ? 'hover:bg-amber-900/30 hover:scale-105 text-amber-300'
                : 'hover:bg-amber-100 hover:scale-105 text-amber-600'
                } active:scale-95`}
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column - Property Info */}
          <div className="w-96 flex-shrink-0 p-6 space-y-6 overflow-y-auto border-r border-amber-200 dark:border-amber-800/30">
            {/* Property Info Card */}
            <div className={`p-5 rounded-2xl border ${isDark
              ? 'bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-800/30'
              : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg font-inter ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                    Property Details
                  </h3>
                  <p className={`text-sm font-inter ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                    {property?.property_type || 'Residential'}
                  </p>
                </div>
              </div>

              {showDetails && (
                <>
                  <div className="mb-4">
                    <img
                      src={property?.main_image || '/imgs/default-property.jpg'}
                      alt={property?.title}
                      className="w-full h-48 object-cover rounded-xl border-2 border-amber-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Price</span>
                      <span className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {property?.price ? `ETB ${property.price.toLocaleString()}` : 'Price on Request'}
                        {property?.listing_type === 'rent' && '/month'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Bedrooms</span>
                      <span className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {property?.beds || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Bathrooms</span>
                      <span className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {property?.baths || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Size</span>
                      <span className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {property?.sqft?.toLocaleString() || 'N/A'} sqft
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                    <p className={`text-sm font-inter ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                      <MapPin className="inline w-3 h-3 mr-1" />
                      {property?.address}, {property?.city || 'Location'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Application Type Card */}
            <div className={`p-5 rounded-2xl border ${isDark
              ? 'bg-gradient-to-r from-purple-900/20 to-purple-800/20 border-purple-800/30'
              : 'bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg font-inter ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                    Application Type
                  </h3>
                  <p className={`text-sm font-inter ${isDark ? 'text-purple-400/80' : 'text-purple-600/80'}`}>
                    {formData.application_type === 'sale' ? 'Purchase' : 'Rental'} Application
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark
                      ? isSubmitted ? 'bg-emerald-900/30 text-emerald-300' : 'bg-amber-900/30 text-amber-300'
                      : isSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {isSubmitted ? 'Submitted' :
                        currentStep === 1 ? 'Drafting' :
                          currentStep === 2 ? 'In Progress' :
                            'Ready to Submit'}
                    </span>
                  </div>
                </div>

                {formData.application_type === "sale" && formData.offered_amount && (
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Your Offer</span>
                      <span className={`font-semibold font-inter ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                        ETB {parseFloat(formData.offered_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Card */}
            <div className={`p-5 rounded-2xl border ${isDark
              ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border-emerald-800/30'
              : 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                    Application Progress
                  </h3>
                  <p className={`text-sm font-inter ${isDark ? 'text-emerald-400/80' : 'text-emerald-600/80'}`}>
                    Step {currentStep} of {totalSteps}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {['Basic Details', 'Preferences', 'Review & Submit'].map((stepName, index) => (
                  <div key={stepName} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep > index + 1
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                      : currentStep === index + 1
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white ring-4 ring-amber-500/20'
                        : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600')
                      }`}>
                      {currentStep > index + 1 ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium font-inter ${currentStep >= index + 1
                        ? (isDark ? 'text-white' : 'text-gray-900')
                        : (isDark ? 'text-gray-400' : 'text-gray-600')
                        }`}>
                        {stepName}
                      </p>
                      <div className={`h-1 mt-1 rounded-full ${currentStep > index + 1
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : currentStep === index + 1
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                          : (isDark ? 'bg-gray-700' : 'bg-gray-300')
                        }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms Card */}
            <div className={`p-5 rounded-2xl border ${isDark
              ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-800/30'
              : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg font-inter ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                    Terms & Conditions
                  </h3>
                  <p className={`text-sm font-inter ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                    Important Information
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className={`text-xs font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-600/80'}`}>
                    By submitting, you agree to our terms and conditions
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className={`text-xs font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-600/80'}`}>
                    Application is subject to property owner approval
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className={`text-xs font-inter ${isDark ? 'text-amber-300/80' : 'text-amber-600/80'}`}>
                    You may be contacted for additional information
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Form */}
          <div className="flex-1 overflow-y-auto p-6">
            {isSubmitted ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-6">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className={`text-2xl font-bold font-montserrat mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ✅ Application Confirmed!
                </h3>
                <p className={`text-lg mb-4 font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Your application for <span className="font-semibold">{property?.title}</span> has been <span className="font-bold text-green-600">confirmed by the server</span>.
                </p>

                {/* BACKEND CONFIRMATION DETAILS */}
                {applicationId && (
                  <div className={`p-6 rounded-xl mb-6 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <ShieldCheck className="w-6 h-6 text-green-500" />
                      <h4 className={`text-lg font-bold font-inter ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                        Backend Confirmation
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Application ID:</span>
                        <span className={`font-mono font-bold font-inter ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                          #{applicationId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
                          ✅ Saved in Database
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Timestamp:</span>
                        <span className={`font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show offer if sale application */}
                {formData.application_type === "sale" && formData.offered_amount && (
                  <div className={`p-4 rounded-xl mb-4 inline-block ${isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-100 border-amber-200'} border`}>
                    <p className={`font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      <span className="font-semibold">Your Offer:</span> ETB {parseFloat(formData.offered_amount).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* NEXT STEPS */}
                <div className={`p-6 rounded-xl mb-8 ${isDark ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-50 border-blue-200'} border`}>
                  <h4 className={`text-lg font-bold mb-3 font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    Next Steps
                  </h4>
                  <ul className={`space-y-2 text-left font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Your application has been securely saved in our database</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>The property owner will review your application within 48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Bell className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>You'll receive email notifications about your application status</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={onClose}
                    className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Copy application details to clipboard
                      const details = `Application #${applicationId} for ${property?.title}`;
                      navigator.clipboard.writeText(details);
                      toast.success('Application details copied!');
                    }}
                    className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                  >
                    Copy Details
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Basic Details */}
                {currentStep === 1 && (
                  <div className={`rounded-2xl p-6 border ${isDark
                    ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-800 border-blue-800/30'
                    : 'bg-gradient-to-br from-white via-blue-50/30 to-white border-blue-200'
                    } shadow-lg`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isDark
                          ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30'
                          : 'bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-200'
                          }`}>
                          <User className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <h2 className={`text-xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Basic Details
                          </h2>
                          <p className={`text-sm font-inter ${isDark ? 'text-blue-300/80' : 'text-blue-600/80'}`}>
                            Tell us about your application
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-sm font-inter ${isDark
                        ? 'bg-blue-900/30 text-blue-300 border border-blue-800/30'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                        Required
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Application Type */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={`block mb-2 font-medium font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                            Application Type
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <FileText className="w-5 h-5 text-amber-500" />
                            </div>
                            <select
                              name="application_type"
                              value={formData.application_type}
                              onChange={handleChange}
                              className={`w-full pl-11 pr-4 py-3.5 rounded-xl border font-inter ${isDark
                                ? 'bg-gray-800/50 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                } focus:outline-none`}
                              disabled
                            >
                              <option value="rent">Rental Application</option>
                              <option value="sale">Purchase Application</option>
                              <option value="lease">Lease Application</option>
                            </select>
                          </div>
                        </div>

                        {formData.application_type === "sale" && (
                          <div>
                            <label className={`block mb-2 font-medium font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                              Your Offer Amount (ETB)
                            </label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                <DollarSign className="w-5 h-5 text-amber-500" />
                              </div>
                              <input
                                type="number"
                                name="offered_amount"
                                value={formData.offered_amount}
                                onChange={handleChange}
                                placeholder="Enter your offer"
                                className={`w-full pl-11 pr-4 py-3.5 rounded-xl border font-inter ${validationErrors.offered_amount
                                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                                  : isDark
                                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                  } focus:outline-none`}
                              />
                            </div>
                            {validationErrors.offered_amount && (
                              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-inter">
                                <AlertCircle className="w-4 h-4" />
                                {validationErrors.offered_amount}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message to Owner */}
                      <div>
                        <label className={`block mb-2 font-medium font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          Message to Property Owner
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Introduce yourself and explain why you're interested in this property..."
                          rows={4}
                          className={`w-full px-4 py-3.5 rounded-xl border font-inter ${validationErrors.message
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : isDark
                              ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                            } focus:outline-none resize-none`}
                        />
                        {validationErrors.message && (
                          <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-inter">
                            <AlertCircle className="w-4 h-4" />
                            {validationErrors.message}
                          </div>
                        )}
                        <div className={`p-3 rounded-lg mt-3 ${isDark ? 'bg-gray-800/30 border border-gray-700' : 'bg-blue-50/50 border border-blue-100'}`}>
                          <p className={`text-sm font-inter ${isDark ? 'text-blue-400/80' : 'text-blue-600/80'}`}>
                            💡 <span className="font-medium">Tip:</span> Share your background, why you're interested in this property, and any relevant experience.
                          </p>
                        </div>
                      </div>

                      {/* Step Navigation */}
                      <div className="flex justify-end mt-8 pt-6 border-t border-blue-200 dark:border-blue-800/30">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          disabled={!formData.message.trim() || (formData.application_type === "sale" && !formData.offered_amount)}
                          className={`px-8 py-3 rounded-xl font-semibold font-inter flex items-center gap-2 transition-all duration-300 ${(!formData.message.trim() || (formData.application_type === "sale" && !formData.offered_amount))
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-50 cursor-not-allowed border border-gray-400'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-xl hover:scale-[1.02] border border-amber-600'
                            } shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          Continue to Preferences
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Preferences */}
                {currentStep === 2 && (
                  <div className={`rounded-2xl p-6 border ${isDark
                    ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-800 border-purple-800/30'
                    : 'bg-gradient-to-br from-white via-purple-50/30 to-white border-purple-200'
                    } shadow-lg`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-xl ${isDark
                        ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30'
                        : 'bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-200'
                        }`}>
                        <Calendar className={`w-6 h-6 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Preferences & Details
                        </h2>
                        <p className={`text-sm font-inter ${isDark ? 'text-purple-400/80' : 'text-purple-600/80'}`}>
                          Tell us about your needs and preferences
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className={`block mb-2 font-medium font-inter ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                            Preferred Move-in Date
                          </label>
                          <input
                            type="date"
                            name="preferred_move_in_date"
                            value={formData.preferred_move_in_date}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full px-4 py-3.5 rounded-xl border font-inter ${validationErrors.preferred_move_in_date
                              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                              : isDark
                                ? 'bg-gray-800/50 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                              } focus:outline-none`}
                          />
                          {validationErrors.preferred_move_in_date && (
                            <div className="flex items-center gap-2 mt-2 text-red-500 text-sm font-inter">
                              <AlertCircle className="w-4 h-4" />
                              {validationErrors.preferred_move_in_date}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={`block mb-2 font-medium font-inter ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                            Additional Occupants
                          </label>
                          <input
                            type="number"
                            name="additional_occupants"
                            value={formData.additional_occupants}
                            onChange={handleChange}
                            min="0"
                            max="10"
                            className={`w-full px-4 py-3.5 rounded-xl border font-inter ${isDark
                              ? 'bg-gray-800/50 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                              } focus:outline-none`}
                          />
                          <p className={`text-xs font-inter mt-2 ${isDark ? 'text-purple-400/80' : 'text-purple-600/80'}`}>Including yourself</p>
                        </div>
                      </div>

                      {/* Checkboxes & Selects */}
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              name="has_pets"
                              checked={formData.has_pets}
                              onChange={handleChange}
                              className="sr-only peer"
                            />
                            <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 peer-checked:border-amber-500 peer-checked:bg-amber-500 transition-all duration-200 flex items-center justify-center">
                              {formData.has_pets && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                          <span className={`text-sm font-inter ${isDark ? 'text-gray-300' : 'text-gray-600'} group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors`}>
                            I have pets
                          </span>
                        </label>

                        <div>
                          <label className={`block mb-2 font-medium font-inter ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                            Financing Preference
                          </label>
                          <select
                            name="financing_preference"
                            value={formData.financing_preference}
                            onChange={handleChange}
                            className={`w-full px-4 py-3.5 rounded-xl border font-inter ${isDark
                              ? 'bg-gray-800/50 border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                              } focus:outline-none`}
                          >
                            <option value="">Select if applicable</option>
                            <option value="cash">Cash</option>
                            <option value="mortgage">Mortgage</option>
                            <option value="lease_to_own">Lease to Own</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Step Navigation */}
                      <div className="flex justify-between mt-8 pt-6 border-t border-purple-200 dark:border-purple-800/30">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className={`px-6 py-3 rounded-xl font-inter transition-all duration-300 ${isDark
                            ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:scale-[1.02] border border-gray-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-[1.02] border border-gray-300'
                            }`}
                        >
                          Back to Basic Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className={`px-8 py-3 rounded-xl font-semibold font-inter flex items-center gap-2 transition-all duration-300 ${'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:shadow-xl hover:scale-[1.02] border border-amber-600'
                            } shadow-lg active:scale-95`}
                        >
                          Continue to Review
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {currentStep === 3 && (
                  <div className={`rounded-2xl p-6 border ${isDark
                    ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-800 border-emerald-800/30'
                    : 'bg-gradient-to-br from-white via-emerald-50/30 to-white border-emerald-200'
                    } shadow-lg`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-xl ${isDark
                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-emerald-100 to-emerald-200 border border-emerald-200'
                        }`}>
                        <FileCheck className={`w-6 h-6 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold font-montserrat ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Review & Submit
                        </h2>
                        <p className={`text-sm font-inter ${isDark ? 'text-emerald-400/80' : 'text-emerald-600/80'}`}>
                          Review your application before submitting
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Application Summary */}
                      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-emerald-50 border border-emerald-100'}`}>
                        <h3 className={`text-lg font-bold mb-4 font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          Application Summary
                        </h3>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Application Type</p>
                              <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formData.application_type === 'sale' ? 'Purchase' : 'Rental'} Application
                              </p>
                            </div>
                            {formData.application_type === "sale" && formData.offered_amount && (
                              <div>
                                <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Your Offer</p>
                                <p className={`font-semibold font-inter ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                                  ETB {parseFloat(formData.offered_amount).toLocaleString()}
                                </p>
                              </div>
                            )}
                            {formData.preferred_move_in_date && (
                              <div>
                                <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Move-in Date</p>
                                <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {formatDate(formData.preferred_move_in_date)}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Additional Occupants</p>
                              <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formData.additional_occupants || 0}
                              </p>
                            </div>
                          </div>

                          {/* Preferences */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Pets</p>
                              <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formData.has_pets ? 'Yes' : 'No'}
                              </p>
                            </div>
                            {formData.financing_preference && (
                              <div>
                                <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Financing</p>
                                <p className={`font-semibold font-inter ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {formData.financing_preference.charAt(0).toUpperCase() + formData.financing_preference.slice(1)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Message Preview */}
                          {formData.message && (
                            <div>
                              <p className={`text-sm font-inter ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Your Message to Owner</p>
                              <p className={`font-inter ${isDark ? 'text-white' : 'text-gray-700'} line-clamp-3`}>
                                {formData.message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Information */}
                      {(formData.cover_letter || formData.special_requests) && (
                        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-blue-50 border border-blue-100'}`}>
                          <h3 className={`text-lg font-bold mb-4 font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                            Additional Information
                          </h3>

                          <div className="space-y-4">
                            {formData.cover_letter && (
                              <div>
                                <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Cover Letter</p>
                                <p className={`font-inter ${isDark ? 'text-white' : 'text-gray-700'} line-clamp-4`}>
                                  {formData.cover_letter}
                                </p>
                              </div>
                            )}

                            {formData.special_requests && (
                              <div>
                                <p className={`text-sm font-inter ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Special Requests</p>
                                <p className={`font-inter ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                  {formData.special_requests}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Important Note */}
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-100 border-amber-200'} border`}>
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className={`text-sm font-inter ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                              <span className="font-medium">Important:</span> Once submitted, you cannot edit your application. Please review all information carefully.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Final Action Buttons */}
                      <div className="flex gap-4 pt-6 border-t border-emerald-200 dark:border-emerald-800/30">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className={`flex-1 py-3.5 rounded-xl font-inter transition-all duration-300 ${isDark
                            ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:scale-[1.02] border border-gray-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-[1.02] border border-gray-300'
                            }`}
                        >
                          Back to Preferences
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`flex-1 py-3.5 rounded-xl font-semibold font-inter flex items-center justify-center gap-2 transition-all duration-300 ${isLoading
                            ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-50 cursor-not-allowed border border-gray-400'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white hover:shadow-xl hover:scale-[1.02] border border-emerald-600'
                            } shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          {isLoading ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <FileText className="w-5 h-5" />
                              Submit Application
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyApplicationModal;