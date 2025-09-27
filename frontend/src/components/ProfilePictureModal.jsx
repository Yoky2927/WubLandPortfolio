import React, { useRef, useState } from "react";

const ProfilePictureModal = ({
  isOpen,
  onClose,
  onUpload,
  userProfilePicture,
  theme,
  firstName,
  lastName,
  role,
}) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Normalize role names to handle different formats from backend
  const normalizeRole = (role) => {
    if (!role) return "default";

    const roleLower = role.toLowerCase().trim();

    const roleMap = {
      admin: "admin",
      administrator: "admin",
      support: "support_agent",
      support_agent: "support_agent",
      "support agent": "support_agent",
      agent: "support_agent",
      broker: "broker",
      seller: "seller",
      buyer: "buyer",
      renter: "renter",
      leaser: "leaser",
      lease: "leaser",
    };

    return roleMap[roleLower] || "default";
  };

  const normalizedRole = normalizeRole(role);
  console.log(
    "📊 ProfilePictureModal - Normalized role:",
    normalizedRole,
    "Original role:",
    role
  );

  const getInitials = () => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const getRoleColor = () => {
    const colors = {
      admin: "bg-red-600",
      support_agent: "bg-teal-500",
      broker: "bg-blue-500",
      seller: "bg-green-500",
      buyer: "bg-purple-500",
      renter: "bg-orange-500",
      leaser: "bg-indigo-500",
      default: "bg-amber-500",
    };
    return colors[normalizedRole] || colors.default;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
  if (!selectedFile) {
    alert("Please select a file first");
    return;
  }

  setIsUploading(true);
  try {
    const response = await onUpload(selectedFile);
    
    // Check if response contains updated user data
    if (response && response.user) {
      // The parent component should handle updating the user state
      console.log('Profile picture updated successfully', response.user);
    }
    
    onClose();
  } catch (error) {
    console.error("Upload error:", error);
    alert("Upload failed. Please try again.");
  } finally {
    setIsUploading(false);
  }
};

  const handleRemovePicture = async () => {
    if (
      window.confirm("Are you sure you want to remove your profile picture?")
    ) {
      // Implement remove functionality
      console.log("Remove profile picture");
      alert("Remove functionality coming soon!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`relative rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden ${
          normalizedRole === "admin"
            ? "gradient-border-red"
            : normalizedRole === "support_agent"
            ? "gradient-border-teal"
            : normalizedRole === "broker"
            ? "gradient-border-blue"
            : "gradient-border-amber"
        } glass-effect`}
      >
        {/* Header */}
        <div
          className={`p-6 text-center glass-effect ${
            normalizedRole === "admin"
              ? "bg-red-900/80"
              : normalizedRole === "support_agent"
              ? "bg-teal-900/80"
              : normalizedRole === "broker"
              ? "bg-blue-900/80"
              : "bg-amber-900/80"
          }`}
        >
          <h3 className="text-xl font-bold text-white">Profile Picture</h3>
          <p className="text-gray-300 text-sm mt-1">
            Update your profile image
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Profile Preview */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-400 shadow-lg"
                />
              ) : userProfilePicture ? (
                <img
                  src={userProfilePicture}
                  alt="Current Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-400 shadow-lg"
                />
              ) : (
                <div
                  className={`w-32 h-32 ${getRoleColor()} rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-amber-400 shadow-lg`}
                >
                  {getInitials()}
                </div>
              )}
              <div
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:bg-amber-600 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
              {previewUrl
                ? "New profile picture preview"
                : userProfilePicture
                ? "Current profile picture"
                : "No profile picture set"}
            </p>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {!selectedFile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Choose Photo</span>
              </button>
            )}

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors duration-300 disabled:opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span>Upload Photo</span>
                  </>
                )}
              </button>
            )}

            {userProfilePicture && !selectedFile && (
              <button
                onClick={handleRemovePicture}
                className="w-full border border-red-400 text-red-500 py-3 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300 flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Remove Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureModal;
