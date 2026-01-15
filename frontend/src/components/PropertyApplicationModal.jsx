import React, { useState, useEffect } from "react";
import { X, FileText, User, Calendar, Home, Building, DollarSign, MessageSquare } from "lucide-react";
import { apiCall } from "../utils/api.endpoints";

const PropertyApplicationModal = ({ isOpen, onClose, property, userType, onSubmit, theme }) => {
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
      };
      
      // Call the submit handler from parent
      await onSubmit(payload);
      
    } catch (error) {
      console.error("Application submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
        theme === "dark" 
          ? "bg-gray-900 border border-gray-700" 
          : "bg-white border border-gray-200"
      }`}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <FileText className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Apply for {property?.title || "Property"}
              </h2>
              <p className="text-sm text-gray-500">
                Complete this form to submit your application
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Property Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={property?.main_image || '/imgs/default-property.jpg'}
                  alt={property?.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{property?.title}</h3>
              <p className="text-gray-500 mb-4">{property?.address}, {property?.city}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-bold text-amber-500">
                    {property?.price?.toLocaleString()} ETB
                    {property?.listing_type === 'rent' && '/month'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium capitalize">{property?.property_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Beds/Baths</p>
                  <p className="font-medium">{property?.beds || 0} bed / {property?.baths || 0} bath</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Size</p>
                  <p className="font-medium">{property?.sqft?.toLocaleString() || 'N/A'} sqft</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Application Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Application Type
              </label>
              <select
                name="application_type"
                value={formData.application_type}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                }`}
                disabled
              >
                <option value="rent">Rental Application</option>
                <option value="sale">Purchase Application</option>
                <option value="lease">Lease Application</option>
              </select>
            </div>
            
            {formData.application_type === "sale" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Offer Amount (ETB)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    name="offered_amount"
                    value={formData.offered_amount}
                    onChange={handleChange}
                    placeholder="Enter your offer"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      validationErrors.offered_amount
                        ? 'border-red-500'
                        : theme === 'dark'
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                {validationErrors.offered_amount && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.offered_amount}</p>
                )}
              </div>
            )}
          </div>

          {/* Message to Owner */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Message to Property Owner
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Introduce yourself and explain why you're interested in this property..."
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border ${
                validationErrors.message
                  ? 'border-red-500'
                  : theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-300'
              }`}
            />
            {validationErrors.message && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.message}</p>
            )}
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Preferred Move-in Date
              </label>
              <input
                type="date"
                name="preferred_move_in_date"
                value={formData.preferred_move_in_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 rounded-lg border ${
                  validationErrors.preferred_move_in_date
                    ? 'border-red-500'
                    : theme === 'dark'
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-300'
                }`}
              />
              {validationErrors.preferred_move_in_date && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.preferred_move_in_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Occupants
              </label>
              <input
                type="number"
                name="additional_occupants"
                value={formData.additional_occupants}
                onChange={handleChange}
                min="0"
                max="10"
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">Including yourself</p>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="has_pets"
                checked={formData.has_pets}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-sm">I have pets</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Financing Preference
              </label>
              <select
                name="financing_preference"
                value={formData.financing_preference}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select if applicable</option>
                <option value="cash">Cash</option>
                <option value="mortgage">Mortgage</option>
                <option value="lease_to_own">Lease to Own</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Cover Letter (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Information (Optional)
            </label>
            <textarea
              name="cover_letter"
              value={formData.cover_letter}
              onChange={handleChange}
              placeholder="Add any additional information, special requests, or questions..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Special Requests
            </label>
            <textarea
              name="special_requests"
              value={formData.special_requests}
              onChange={handleChange}
              placeholder="Any special conditions or requests..."
              rows={2}
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500">
              By submitting, you agree to our terms and conditions
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        </form>
      </div>
    </div>
  );
};

export default PropertyApplicationModal;