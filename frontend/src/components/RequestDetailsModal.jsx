import React from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  MessageCircle,
  Hammer,
} from "lucide-react";
import BrokerChatModal from "./BrokerChatInterface";

const getCleanImageUrl = (img) => {
  if (!img) return null;

  // If img is an object
  if (typeof img === "object") {
    const url = img.url || img.path || img.src;
    if (url) {
      // Fix Windows paths
      if (url.includes("\\")) {
        const filename = url.split("\\").pop();
        return `http://localhost:5002/uploads/temp/${filename}`;
      }
      return url;
    }

    // Try filename
    if (img.filename) {
      return `http://localhost:5002/uploads/temp/${img.filename}`;
    }
  }

  // If img is a string
  if (typeof img === "string") {
    if (img.includes("\\")) {
      const filename = img.split("\\").pop();
      return `http://localhost:5002/uploads/temp/${filename}`;
    }
    return img;
  }

  return null;
};

const RequestDetailsModal = ({
  request,
  isOpen,
  onClose,
  theme,
  onAccept,
  onMessage,
  onStartTools,
}) => {
  if (!isOpen) return null;

  // Determine button states
  const isAssignedToMe = request.status === "assigned" && request.request_status === "assigned_to_me";
  const isAvailable = request.status === "pending" && request.request_status === "available";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`max-w-4xl w-full max-h-[90vh] rounded-xl overflow-auto ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Property Request Details</h2>
              <p className="text-gray-500">ID: #{request.id}</p>
              {/* Status Badge */}
              <div className="mt-2">
                <span className={`px-3 py-1 text-xs font-medium ${
                  isAssignedToMe 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                    : isAvailable
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                }`}>
                  {isAssignedToMe ? "Assigned to You" : 
                   isAvailable ? "Available to Claim" : 
                   "Assigned to Another Broker"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Request Details */}
            <div className="space-y-6">
              {/* Client Information */}
              <div
                className={`p-4 border ${theme === "dark" ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium">
                      {request.client_name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{request.client_phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{request.client_email || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div
                className={`p-4 border ${theme === "dark" ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}
              >
                <h3 className="font-semibold mb-3">Property Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium capitalize">
                      {request.property_type || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <p className="font-medium">{request.location}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <p className="font-medium text-green-600">
                        ETB {parseInt(request.budget).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {request.schedule_date && (
                    <div>
                      <p className="text-sm text-gray-500">Requested Viewing</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            {new Date(
                              request.schedule_date,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{request.schedule_time}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div
                className={`p-4 border ${theme === "dark" ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </h3>
                <p className={` ${theme === "dark" ? "text-gray-300" : "text-gray-700"} whitespace-pre-line`}>
                  {request.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Right Column - Images and Actions */}
            <div className="space-y-6">
              {/* Images */}
              <div
                className={`p-4 border ${theme === "dark" ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Property Images
                </h3>
                {request.images && request.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {request.images.map((img, index) => {
                      const imageUrl = getCleanImageUrl(img);
                      console.log(`📸 Modal loading image ${index}:`, imageUrl);

                      return (
                        <div
                          key={index}
                          className="aspect-square overflow-hidden bg-gray-200"
                        >
                          <img
                            src={imageUrl}
                            alt={`Property ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(
                                `❌ Modal failed to load image:`,
                                imageUrl,
                              );
                              e.target.onerror = null;
                              e.target.src = `https://via.placeholder.com/400x300/cccccc/666666?text=Image+${index + 1}`;
                            }}
                            onLoad={() =>
                              console.log(`✅ Modal loaded image:`, imageUrl)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No images provided</p>
                  </div>
                )}
              </div>

              {/* Property Details from Database (if available) */}
              {request.property_data && (request.property_data.beds || request.property_data.baths || request.property_data.sqft) && (
                <div
                  className={`p-4 border ${theme === "dark" ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}
                >
                  <h3 className="font-semibold mb-3">Property Specifications</h3>
                  <div className="space-y-2 text-sm">
                    {request.property_data.beds && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bedrooms:</span>
                        <span>{request.property_data.beds}</span>
                      </div>
                    )}
                    {request.property_data.baths && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bathrooms:</span>
                        <span>{request.property_data.baths}</span>
                      </div>
                    )}
                    {request.property_data.sqft && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Area:</span>
                        <span>{request.property_data.sqft} m²</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Accept Request Button - Only show if available */}
                {isAvailable && (
                  <button
                    onClick={() => {
                      onAccept();
                      onClose();
                    }}
                    className="Button2 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Accept Request
                  </button>
                )}

            

                {/* Message Client Button - Show for all requests */}
                <button
                  onClick={() => {
                    onMessage();
                    onClose();
                  }}
                  className="Button2 w-full text-blue-700 hover:test-white px-4 py-3 bg-blue-500 hover:bg-blue-600 font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message Client
                </button>

                {/* Start Professional Tools Button - Only show if assigned to you */}
                {isAssignedToMe && (
                  <button
                    onClick={() => {
                      onStartTools();
                      onClose();
                    }}
                    className="Button2 w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center justify-center gap-2"
                  >
                    <Hammer className="w-5 h-5" />
                    Start Professional Tools
                  </button>
                )}

                {/* REMOVED: Start Professional Tools (disabled) logic */}

                <button
                  onClick={onClose}
                  className="Button2 w-full px-4 py-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsModal;