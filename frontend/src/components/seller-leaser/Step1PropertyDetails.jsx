import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  Plus,
  MapPin,
  DollarSign,
  Home,
  Check,
  CheckCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Filter,
  ChevronRight,
  Building,
  Landmark,
  Briefcase,
  FileText,
  Loader,
  Eye,
  Clock,
  Shield,
  Sparkles,
  ArrowRight,
  Info,
  HelpCircle,
  FileImage,
  Calendar,
  Users,
  Ruler,
  Bath,
  Bed,
  Expand,
  Compass,
  Layers,
  Star,
} from "lucide-react";
import { toast } from "react-hot-toast";

const Step1PropertyDetails = ({
  theme,
  formData,
  formErrors,
  handleInputChange,
  handleSubmitPropertyRequest,
  isLoading,
  propertyImages = [],
  imagePreviews = [],
  setPropertyImages,
  setImagePreviews,
  setFormData,
  setFormErrors,
  formatCurrency,
  userType = "seller",
}) => {
  const [localImagePreviews, setLocalImagePreviews] = useState([]);
  const [localPropertyImages, setLocalPropertyImages] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeImageType, setActiveImageType] = useState(null);
  const [showImageGuide, setShowImageGuide] = useState(true);
  const [uploadProgress, setUploadProgress] = useState({});
  const [propertyStats, setPropertyStats] = useState({
    totalImages: 0,
    requiredImages: 0,
    uploadedImages: 0,
    imageTypes: {},
  });
  const fileInputRef = useRef(null);

  const isDark = theme === "dark";

  // Use local state if provided from parent, otherwise use local state
  const currentImagePreviews =
    imagePreviews.length > 0 ? imagePreviews : localImagePreviews;
  const currentPropertyImages =
    propertyImages.length > 0 ? propertyImages : localPropertyImages;

  // Initialize form data if not provided
  useEffect(() => {
    if (!formData || Object.keys(formData).length === 0) {
      setFormData({
        property_type: "",
        location: "",
        price: "",
        price_currency: "ETB",
        verification_method: "physical",
        description: "",
        beds: "",
        baths: "",
        sqft: "",
        user_type: userType,
        property_images: [],
      });
    }
  }, [userType]);

  // Update property stats
  useEffect(() => {
    const imageTypes = {};
    currentImagePreviews.forEach((img) => {
      if (img.type) {
        imageTypes[img.type] = (imageTypes[img.type] || 0) + 1;
      }
    });

    setPropertyStats({
      totalImages: currentImagePreviews.length,
      requiredImages: 3,
      uploadedImages: currentImagePreviews.length,
      imageTypes,
    });
  }, [currentImagePreviews]);

  const isFormValid =
    formData?.property_type &&
    formData?.location &&
    formData?.price &&
    currentImagePreviews.length >= 3 &&
    Object.values(propertyStats.imageTypes).length >= 3;

  // Property type options
  const propertyTypeOptions = [
    {
      value: "house",
      label: "House",
      icon: <Home className="w-4 h-4" />,
      color: "amber",
    },
    {
      value: "apartment",
      label: "Apartment",
      icon: <Building className="w-4 h-4" />,
      color: "blue",
    },
    {
      value: "villa",
      label: "Villa",
      icon: <Landmark className="w-4 h-4" />,
      color: "emerald",
    },
    {
      value: "condo",
      label: "Condo",
      icon: <Briefcase className="w-4 h-4" />,
      color: "purple",
    },
    {
      value: "commercial",
      label: "Commercial",
      icon: <Briefcase className="w-4 h-4" />,
      color: "orange",
    },
    {
      value: "land",
      label: "Land",
      icon: <Compass className="w-4 h-4" />,
      color: "green",
    },
    {
      value: "other",
      label: "Other",
      icon: <Home className="w-4 h-4" />,
      color: "gray",
    },
  ];

  // Verification method options
  const verificationOptions = [
    {
      value: "physical",
      label: "Physical Visit",
      icon: <Users className="w-4 h-4" />,
      color: "green",
    },
    {
      value: "video",
      label: "Video Call",
      icon: <Eye className="w-4 h-4" />,
      color: "blue",
    },
    {
      value: "documents",
      label: "Document Upload",
      icon: <FileText className="w-4 h-4" />,
      color: "amber",
    },
    {
      value: "mixed",
      label: "Mixed",
      icon: <Layers className="w-4 h-4" />,
      color: "purple",
    },
  ];

  const handleMultipleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    const validFiles = files.filter((file) => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        toast.error(
          `Invalid file type for ${file.name}. Please upload JPEG, JPG, PNG, or WebP.`,
        );
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    const filesToProcess = validFiles.slice(0, 3 - currentImagePreviews.length);

    if (filesToProcess.length === 0) return;

    // Create previews for each image with progress tracking
    const newPreviews = [...currentImagePreviews];
    const newUploadProgress = { ...uploadProgress };

    filesToProcess.forEach((file, index) => {
      const reader = new FileReader();
      const fileId = `img_${Date.now()}_${index}`;

      // Simulate upload progress
      newUploadProgress[fileId] = 0;
      const progressInterval = setInterval(() => {
        newUploadProgress[fileId] += 10;
        setUploadProgress({ ...newUploadProgress });
        if (newUploadProgress[fileId] >= 90) {
          clearInterval(progressInterval);
        }
      }, 100);

      reader.onloadend = () => {
        newPreviews.push({
          url: reader.result,
          type: "",
          id: fileId,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        });
        setLocalImagePreviews([...newPreviews]);
        if (setImagePreviews) setImagePreviews([...newPreviews]);

        // Complete progress
        newUploadProgress[fileId] = 100;
        setUploadProgress({ ...newUploadProgress });

        setTimeout(() => {
          delete newUploadProgress[fileId];
          setUploadProgress({ ...newUploadProgress });
        }, 500);
      };
      reader.readAsDataURL(file);
    });

    // Add to form data
    const newImages = [...currentPropertyImages, ...filesToProcess];
    setLocalPropertyImages(newImages);
    if (setPropertyImages) setPropertyImages(newImages);

    setFormData((prev) => ({
      ...prev,
      property_images: newImages,
    }));

    if (formErrors?.property_images) {
      setFormErrors((prev) => ({ ...prev, property_images: undefined }));
    }

    toast.success(
      `Added ${filesToProcess.length} photo${filesToProcess.length > 1 ? "s" : ""}`,
    );
  };

  const handleRemoveSpecificImage = (index) => {
    const newPreviews = currentImagePreviews.filter((_, i) => i !== index);
    setLocalImagePreviews(newPreviews);
    if (setImagePreviews) setImagePreviews(newPreviews);

    const newImages = currentPropertyImages.filter((_, i) => i !== index);
    setLocalPropertyImages(newImages);
    if (setPropertyImages) setPropertyImages(newImages);

    setFormData((prev) => ({
      ...prev,
      property_images: newImages,
    }));

    toast.success("Photo removed");
  };

  const handleSetImageType = (index, type) => {
    const updatedPreviews = [...currentImagePreviews];
    updatedPreviews[index] = { ...updatedPreviews[index], type };
    setLocalImagePreviews(updatedPreviews);
    if (setImagePreviews) setImagePreviews(updatedPreviews);

    setFormData((prev) => ({
      ...prev,
      property_images:
        prev.property_images?.map((img, i) =>
          i === index ? { ...img, type } : img,
        ) || [],
    }));

    setActiveImageType(null);
    toast.success(`Set as ${type.replace("_", " ")} photo`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "uploaded":
        return {
          text: "Uploaded",
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
          textColor: "text-emerald-700 dark:text-emerald-300",
          borderColor: "border-emerald-200 dark:border-emerald-800",
        };
      case "required":
        return {
          text: "Required",
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
          textColor: "text-amber-700 dark:text-amber-300",
          borderColor: "border-amber-200 dark:border-amber-800",
        };
      default:
        return {
          text: "Pending",
          icon: <Clock className="w-3.5 h-3.5" />,
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          textColor: "text-blue-700 dark:text-blue-300",
          borderColor: "border-blue-200 dark:border-blue-800",
        };
    }
  };

  const renderError = (field) =>
    formErrors?.[field] && (
      <div
        className={`p-3 rounded-xl mt-2 border ${
          isDark
            ? "bg-red-900/20 border-red-800/30"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <p className="text-sm font-inter text-red-700 dark:text-red-300">
            {formErrors[field]}
          </p>
        </div>
      </div>
    );

  const renderFormField = (
    label,
    field,
    type = "text",
    options = [],
    placeholder = "",
    icon = null,
  ) => (
    <div>
      <label
        className={`block text-sm font-medium mb-3 font-inter ${isDark ? "text-amber-200" : "text-amber-800"}`}
      >
        {icon && (
          <span className="inline-flex items-center gap-2">
            {icon} {label}
          </span>
        )}
        {!icon && label}
      </label>
      {type === "select" ? (
        <div className="relative">
          <select
            value={formData?.[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`w-full pl-10 pr-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 appearance-none ${
              isDark
                ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-amber-800/30 text-white hover:border-amber-400"
                : "bg-gradient-to-r from-white to-amber-50/30 border-amber-200 text-gray-900 hover:border-amber-400"
            } ${formErrors?.[field] ? "border-red-500" : ""}`}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
        </div>
      ) : (
        <div className="relative">
          {type === "textarea" ? (
            <textarea
              value={formData?.[field] || ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={placeholder}
              rows={4}
              className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
                isDark
                  ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-amber-800/30 text-white placeholder-amber-300/40 hover:border-amber-400"
                  : "bg-gradient-to-r from-white to-amber-50/30 border-amber-200 text-gray-900 placeholder-amber-600/40 hover:border-amber-400"
              } ${formErrors?.[field] ? "border-red-500" : ""}`}
            />
          ) : (
            <input
              type={type}
              value={formData?.[field] || ""}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleInputChange(field, e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              placeholder={placeholder}
              className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
                isDark
                  ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-amber-800/30 text-white placeholder-amber-300/40 hover:border-amber-400"
                  : "bg-gradient-to-r from-white to-amber-50/30 border-amber-200 text-gray-900 placeholder-amber-600/40 hover:border-amber-400"
              } ${formErrors?.[field] ? "border-red-500" : ""}`}
            />
          )}
        </div>
      )}
      {renderError(field)}
    </div>
  );

  const uploadImagesToRequest = async (requestId, images) => {
    try {
      console.log(
        `📸 Uploading ${images.length} images for request ${requestId}`,
      );

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const formData = new FormData();
        formData.append("image", image);
        formData.append("is_primary", i === 0 ? "1" : "0");
        formData.append("image_order", i.toString());

        try {
          const response = await apiCall(
            "UPLOAD_REQUEST_IMAGE",
            { requestId },
            {
              body: formData,
              method: "POST",
            },
          );

          console.log(`✅ Image ${i + 1} uploaded successfully`);
        } catch (imageError) {
          console.error(`❌ Failed to upload image ${i + 1}:`, imageError);
        }
      }

      console.log(`📊 Image upload completed for request ${requestId}`);
    } catch (error) {
      console.error("❌ Error in uploadImagesToRequest:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isFormValid) {
      const errors = [];
      if (!formData?.property_type) errors.push("Property type");
      if (!formData?.location) errors.push("Location");
      if (!formData?.price) errors.push("Price");
      if (currentImagePreviews.length < 3) errors.push("At least 3 photos");

      toast.error(`Please complete: ${errors.join(", ")}`);
      return;
    }

    try {
      setIsSubmitted(true);

      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData();

      // Prepare property data as JSON string
      const propertyData = {
        property_type: formData.property_type,
        location: formData.location,
        price: parseFloat(formData.price),
        price_currency: "ETB",
        verification_method: formData.verification_method || "physical",
        description: formData.description || "",
        beds: formData.beds ? parseInt(formData.beds) : null,
        baths: formData.baths ? parseFloat(formData.baths) : null,
        sqft: formData.sqft ? parseInt(formData.sqft) : null,
        user_type: formData.user_type || userType,
        year_built: "",
        amenities: [],
        features: [],
      };

      // Add property_data as JSON string
      formDataToSend.append("property_data", JSON.stringify(propertyData));

      // Prepare image metadata
      const imageMetadata = currentImagePreviews.map((preview) => ({
        type: preview.type || "",
        fileName: preview.fileName || "",
        fileSize: preview.fileSize || 0,
        uploadedAt: preview.uploadedAt || new Date().toISOString(),
      }));

      // Add image metadata as JSON
      formDataToSend.append(
        "property_images_metadata",
        JSON.stringify(imageMetadata),
      );

      console.log("📤 Converting base64 images to files...");

      for (let i = 0; i < currentImagePreviews.length; i++) {
        const preview = currentImagePreviews[i];

        if (preview.url && preview.url.startsWith("data:image")) {
          try {
            // Convert base64 to blob/file
            const response = await fetch(preview.url);
            const blob = await response.blob();

            // Extract file extension from base64 or MIME type
            let fileExtension = ".jpg"; // Default
            if (blob.type === "image/png") fileExtension = ".png";
            if (blob.type === "image/webp") fileExtension = ".webp";
            if (blob.type === "image/gif") fileExtension = ".gif";
            if (blob.type === "image/jpeg") fileExtension = ".jpg";

            // Generate a proper filename with extension
            const timestamp = Date.now();
            const fileName = preview.type
              ? `${preview.type}_${timestamp}_${i}${fileExtension}`
              : `property_image_${timestamp}_${i}${fileExtension}`;

            // Create File object from blob with proper extension
            const file = new File([blob], fileName, {
              type: blob.type,
              lastModified: Date.now(),
            });

            // Add to FormData (field name must match multer's field name)
            formDataToSend.append("property_images", file);

            console.log(`✅ Converted image ${i + 1} to file:`, {
              name: file.name,
              type: file.type,
              size: file.size,
              originalType: preview.type,
              hasExtension: file.name.endsWith(fileExtension),
            });
          } catch (imageError) {
            console.error(`❌ Failed to convert image ${i + 1}:`, imageError);
            toast.error(`Failed to process image ${i + 1}`);
            setIsSubmitted(false);
            return;
          }
        } else if (preview instanceof File) {
          // If it's already a File object (from file input), add it directly
          formDataToSend.append("property_images", preview);
          console.log(`📤 Adding existing file ${i + 1}:`, {
            name: preview.name,
            type: preview.type,
            size: preview.size,
          });
        }
      }

      // Debug: Log FormData contents
      console.log("📤 FormData contents:");
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`  📁 ${key}:`, {
            name: value.name,
            type: value.type,
            size: value.size,
            hasExtension: value.name.match(/\.(jpg|jpeg|png|gif|webp)$/)
              ? "✅"
              : "❌",
          });
        } else {
          console.log(
            `  📝 ${key}:`,
            typeof value === "string"
              ? value.length > 100
                ? value.substring(0, 100) + "..."
                : value
              : value,
          );
        }
      }

      console.log("📤 Submitting FormData with:", {
        propertyData,
        imageCount: currentImagePreviews.length,
        imageMetadata,
      });

      // Call the submit function with FormData
      await handleSubmitPropertyRequest(formDataToSend);
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error);
      toast.error(error.message || "Failed to submit property details");
      setIsSubmitted(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="py-8 animate-fadeIn">
        <div className="text-center py-8">
          <div className="relative mx-auto w-36 h-36 mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full animate-pulse"></div>
            <div
              className={`absolute inset-4 ${
                isDark ? "bg-gray-900" : "bg-white"
              } rounded-full flex items-center justify-center`}
            >
              <CheckCircle className="w-16 h-16 text-emerald-500 animate-scaleIn" />
            </div>
          </div>
          <h4
            className={`text-2xl font-bold mb-6 font-montserrat ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Property Details Submitted
          </h4>
          <div className="max-w-2xl mx-auto mb-10">
            <p
              className={`text-lg mb-6 font-inter ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Your property details have been submitted successfully. You can
              now proceed to select a broker.
            </p>
            <div
              className={`p-8 rounded-2xl mb-6 border ${
                isDark
                  ? "bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-emerald-800/30"
                  : "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-center gap-4 mb-6">
                <Home className="w-8 h-8 text-emerald-500" />
                <span className="text-xl font-semibold font-inter text-emerald-700 dark:text-emerald-300">
                  Property Details Complete
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-6">
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? "border-emerald-800/30" : "border-emerald-200"
                  }`}
                >
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                    Property Type
                  </p>
                  <p className="text-lg font-bold font-inter">
                    {formData.property_type}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? "border-emerald-800/30" : "border-emerald-200"
                  }`}
                >
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                    Location
                  </p>
                  <p className="text-lg font-bold font-inter">
                    {formData.location}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? "border-emerald-800/30" : "border-emerald-200"
                  }`}
                >
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                    Price
                  </p>
                  <p className="text-lg font-bold font-inter">
                    {formatCurrency
                      ? formatCurrency(formData.price)
                      : `ETB ${formData.price}`}
                  </p>
                </div>
              </div>
              {currentImagePreviews.length > 0 && (
                <div className="mt-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium mb-3 text-emerald-600 dark:text-emerald-400">
                    Uploaded Photos:
                  </p>
                  <div className="flex gap-3">
                    {currentImagePreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-emerald-300 dark:border-emerald-600 group"
                      >
                        <img
                          src={preview.url}
                          alt={`Property ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {preview.type
                            ? preview.type.replace("_", " ")
                            : "Photo"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              // Navigate to step 2
              if (typeof handleSubmitPropertyRequest === "function") {
                // Call a function to move to next step
                handleSubmitPropertyRequest({ action: "navigateToStep2" });
              }
            }}
            className="px-10 py-4 font-bold text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl"
          >
            Continue to Broker Selection
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="py-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-8">
        <h4
          className={`text-2xl font-semibold mb-4 font-montserrat ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Tell Us About Your Property
        </h4>
        <p
          className={`mb-6 font-inter ${isDark ? "text-gray-300" : "text-gray-600"}`}
        >
          Provide detailed information about your property to get started.
        </p>
      </div>

      {/* Image Upload Guide */}
      {showImageGuide && (
        <div
          className={`mb-6 p-5 rounded-2xl border ${
            isDark
              ? "bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-800/30"
              : "bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Info
                className={`w-6 h-6 ${isDark ? "text-amber-400" : "text-amber-600"} flex-shrink-0 mt-0.5`}
              />
              <div>
                <p
                  className={`font-bold font-inter ${isDark ? "text-amber-300" : "text-amber-800"}`}
                >
                  Upload Requirements
                </p>
                <p
                  className={`text-sm font-inter mt-1 ${isDark ? "text-amber-400/80" : "text-amber-700/80"}`}
                >
                  You need to upload at least 3 photos: Outside view, Living
                  room, and Kitchen
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowImageGuide(false)}
              className={`p-1 rounded-lg ${isDark ? "hover:bg-amber-900/30" : "hover:bg-amber-100"}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <form
        onSubmit={handleSubmit}
        className={`p-8 rounded-3xl border-2 ${
          isDark
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-amber-800/30"
            : "bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200"
        } backdrop-blur-sm`}
      >
        {/* Image Upload Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h5
              className={`text-lg font-semibold font-inter flex items-center gap-2 ${
                isDark ? "text-amber-200" : "text-amber-800"
              }`}
            >
              <Camera className="w-5 h-5" />
              Property Photos
            </h5>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-inter ${
                  isDark ? "text-amber-300/80" : "text-amber-700/80"
                }`}
              >
                {propertyStats.uploadedImages} of {propertyStats.requiredImages}{" "}
                required
              </span>
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            </div>
          </div>

          {/* Upload Area */}
          {currentImagePreviews.length < 3 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-3 border-dashed rounded-2xl p-10 text-center transition-all duration-500 cursor-pointer ${
                isDark
                  ? "border-amber-600/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-amber-800 hover:shadow-2xl"
                  : "border-amber-300 bg-gradient-to-br from-gray-50 to-white hover:border-amber-800 hover:shadow-2xl"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleMultipleImageUpload}
                className="hidden"
              />

              <div className="space-y-6">
                <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center shadow-lg">
                  <Upload
                    className={`w-16 h-16 ${isDark ? "text-amber-800" : "text-amber-600"}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-lg font-semibold font-inter mb-2 ${isDark ? "text-amber-200" : "text-amber-800"}`}
                  >
                    Upload {3 - currentImagePreviews.length} more photo
                    {3 - currentImagePreviews.length === 1 ? "" : "s"}
                  </p>
                  <p
                    className={`text-sm font-inter ${isDark ? "text-amber-300/80" : "text-amber-700/80"}`}
                  >
                    Drag & drop or click to browse files
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-xl ${
                isDark
                  ? "bg-gradient-to-r from-emerald-900/20 to-green-900/20 border border-emerald-700"
                  : "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <p className="font-medium font-inter text-emerald-600 dark:text-emerald-400">
                  All required photos uploaded!
                </p>
              </div>
            </div>
          )}

          {/* Image Preview Grid */}
          {currentImagePreviews.length > 0 && (
            <div className="mt-6">
              <h5
                className={`text-sm font-medium mb-4 font-inter ${isDark ? "text-amber-200" : "text-amber-800"}`}
              >
                Uploaded Photos ({currentImagePreviews.length}/3)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="relative overflow-hidden rounded-xl border-2 border-amber-300 dark:border-amber-600">
                      <img
                        src={preview.url}
                        alt={`Property photo ${index + 1}`}
                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSpecificImage(index);
                          }}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {!preview.type && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                          <div className="text-center">
                            <p className="text-white text-lg font-medium mb-4">
                              Select photo type:
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {["outside_view", "living_room", "kitchen"].map(
                                (type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() =>
                                      handleSetImageType(index, type)
                                    }
                                    className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors"
                                  >
                                    {type.replace("_", " ")}
                                  </button>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {preview.type && (
                        <div
                          className={`absolute top-2 left-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                            isDark
                              ? "bg-amber-900/80 text-amber-100 backdrop-blur-sm"
                              : "bg-amber-100/90 text-amber-800 backdrop-blur-sm"
                          }`}
                        >
                          {preview.type
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderError("property_images")}
        </div>

        {/* Property Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Property Type */}
            {renderFormField(
              "Property Type *",
              "property_type",
              "select",
              propertyTypeOptions,
              "Select Property Type",
              <Building className="w-4 h-4" />,
            )}

            {/* Location */}
            <div>
              <label
                className={`block text-sm font-medium mb-3 font-inter flex items-center gap-2 ${
                  isDark ? "text-amber-200" : "text-amber-800"
                }`}
              >
                <MapPin className="w-4 h-4" />
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
                <input
                  type="text"
                  value={formData?.location || ""}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Enter sub-city, woreda, or specific address"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
                    isDark
                      ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-amber-800/30 text-white placeholder-amber-300/40 hover:border-amber-400"
                      : "bg-gradient-to-r from-white to-amber-50/30 border-amber-200 text-gray-900 placeholder-amber-600/40 hover:border-amber-400"
                  } ${formErrors?.location ? "border-red-500" : ""}`}
                />
              </div>
              {renderError("location")}
            </div>

            {/* Price */}
            <div>
              <label
                className={`block text-sm font-medium mb-3 font-inter flex items-center gap-2 ${
                  isDark ? "text-amber-200" : "text-amber-800"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                {formData?.user_type === "seller"
                  ? "Expected Price (ETB) *"
                  : "Monthly Rent (ETB) *"}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-5 h-5" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData?.price || ""}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="Enter amount in ETB"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
                    isDark
                      ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-amber-800/30 text-white placeholder-amber-300/40 hover:border-amber-400"
                      : "bg-gradient-to-r from-white to-amber-50/30 border-amber-200 text-gray-900 placeholder-amber-600/40 hover:border-amber-400"
                  } ${formErrors?.price ? "border-red-500" : ""}`}
                />
              </div>
              {renderError("price")}
            </div>

            {/* Verification Method */}
            {renderFormField(
              "Verification Method",
              "verification_method",
              "select",
              verificationOptions,
              "Select Verification Method",
              <Shield className="w-4 h-4" />,
            )}
          </div>

          {/* Right Column - Property Details */}
          <div className="space-y-6">
            <h5
              className={`text-lg font-semibold font-inter flex items-center gap-2 ${
                isDark ? "text-amber-200" : "text-amber-800"
              }`}
            >
              <Ruler className="w-5 h-5" />
              Property Specifications
            </h5>

            {/* Bedrooms */}
            <div>
              <label
                className={`block text-sm font-medium mb-3 font-inter flex items-center gap-2 ${
                  isDark ? "text-amber-200" : "text-amber-800"
                }`}
              >
                <Bed className="w-4 h-4" />
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                value={formData?.beds || ""}
                onChange={(e) => handleInputChange("beds", e.target.value)}
                placeholder="Number of bedrooms"
                className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-amber-800/30 text-white placeholder-amber-300/40 hover:border-amber-400"
                    : "bg-gradient-to-r from-white to-amber-50/30 border-amber-200 text-gray-900 placeholder-amber-600/40 hover:border-amber-400"
                }`}
              />
            </div>

            {/* Bathrooms */}
            <div>
              <label
                className={`block text-sm font-medium mb-3 font-inter flex items-center gap-2 ${
                  isDark ? "text-amber-200" : "text-amber-800"
                }`}
              >
                <Bath className="w-4 h-4" />
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData?.baths || ""}
                onChange={(e) => handleInputChange("baths", e.target.value)}
                placeholder="Number of bathrooms"
                className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-amber-800/30 text-white placeholder-amber-300/40 hover:border-amber-400"
                    : "bg-gradient-to-r from-white to-amber-50/30 border-amber-200 text-gray-900 placeholder-amber-600/40 hover:border-amber-400"
                }`}
              />
            </div>

            {/* Area */}
            <div>
              <label
                className={`block text-sm font-medium mb-3 font-inter flex items-center gap-2 ${
                  isDark ? "text-amber-200" : "text-amber-800"
                }`}
              >
                <Expand className="w-4 h-4" />
                Area (sqm)
              </label>
              <input
                type="number"
                min="0"
                value={formData?.sqft || ""}
                onChange={(e) => handleInputChange("sqft", e.target.value)}
                placeholder="Property area in square meters"
                className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-amber-800/30 text-white placeholder-amber-300/40 hover:border-amber-400"
                    : "bg-gradient-to-r from-white to-amber-50/30 border-amber-200 text-gray-900 placeholder-amber-600/40 hover:border-amber-400"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <label
            className={`block text-sm font-medium mb-3 font-inter flex items-center gap-2 ${
              isDark ? "text-amber-200" : "text-amber-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            Description
          </label>
          <textarea
            value={formData?.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe your property (features, amenities, nearby facilities, etc.)"
            rows={5}
            className={`w-full px-4 py-3.5 rounded-xl border focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 ${
              isDark
                ? "bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-amber-800/30 text-white placeholder-amber-300/40 hover:border-amber-400"
                : "bg-gradient-to-r from-white to-amber-50/30 border-amber-200 text-gray-900 placeholder-amber-600/40 hover:border-amber-400"
            }`}
          />
        </div>

        {/* Submit Button */}
        <div className="mt-10">
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full py-4 px-6 rounded-2xl font-bold font-inter text-lg transition-all duration-500 ${
              !isFormValid
                ? isDark
                  ? "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>
                  Submit Property Details ({propertyStats.uploadedImages}/
                  {propertyStats.requiredImages} photos)
                </span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step1PropertyDetails;
