import React, { useRef, useState } from "react";
import { Camera, X, Upload, Trash2, Edit3, CheckCircle } from "lucide-react";

const ProfilePictureModal = ({
  isOpen,
  onClose,
  userProfilePicture,
  theme,
  firstName,
  lastName,
  role,
}) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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

  const getInitials = () => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const getRoleColor = () => {
    const colors = {
      admin: "bg-gradient-to-br from-red-500 to-red-600",
      support_agent: "bg-gradient-to-br from-teal-500 to-teal-600",
      broker: "bg-gradient-to-br from-blue-500 to-blue-600",
      seller: "bg-gradient-to-br from-green-500 to-green-600",
      buyer: "bg-gradient-to-br from-purple-500 to-purple-600",
      renter: "bg-gradient-to-br from-orange-500 to-orange-600",
      leaser: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      default: "bg-gradient-to-br from-amber-500 to-amber-600",
    };
    return colors[normalizedRole] || colors.default;
  };

  const getHeaderBg = () => {
    const backgrounds = {
      admin: "bg-gradient-to-r from-red-900/90 to-red-800/90",
      support_agent: "bg-gradient-to-r from-teal-900/90 to-teal-800/90",
      broker: "bg-gradient-to-r from-blue-900/90 to-blue-800/90",
      seller: "bg-gradient-to-r from-green-900/90 to-green-800/90",
      buyer: "bg-gradient-to-r from-purple-900/90 to-purple-800/90",
      renter: "bg-gradient-to-r from-orange-900/90 to-orange-800/90",
      leaser: "bg-gradient-to-r from-indigo-900/90 to-indigo-800/90",
      default: "bg-gradient-to-r from-amber-900/90 to-amber-800/90",
    };
    return backgrounds[normalizedRole] || backgrounds.default;
  };

  const getPopupBackground = () => {
    return theme === 'dark' 
      ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      : "bg-gradient-to-br from-amber-50 via-white to-gray-100";
  };

  const getCardBackground = () => {
    return theme === 'dark' 
      ? "bg-gray-800/80 border-gray-700" 
      : "bg-white border-gray-200";
  };

  const getTextColor = () => {
    return theme === 'dark' ? "text-white" : "text-gray-900";
  };

  const getSecondaryTextColor = () => {
    return theme === 'dark' ? "text-gray-300" : "text-gray-600";
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

  // Ensure proper file upload handling
  const handleUpload = async () => {
    const authToken = localStorage.getItem('token'); // Retrieve token from localStorage

    if (!selectedFile) {
      console.error('No file selected for upload');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      const response = await fetch('/api/auth/upload-profile', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`, // Ensure authToken is valid
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleRemovePicture = async () => {
    if (
      window.confirm("Are you sure you want to remove your profile picture?")
    ) {
      console.log("Remove profile picture");
      alert("Remove functionality coming soon!");
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000]"
      onClick={handleBackdropClick}
    >
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
        <div 
          className={`relative rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden border ${
            theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
          } ${getPopupBackground()}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 text-center relative overflow-hidden ${getHeaderBg()}`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
            </div>

            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
                theme === 'dark' 
                  ? 'text-gray-300 hover:bg-gray-700/80 hover:text-white' 
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-2">Profile Picture</h3>
              <p className="text-white/80 text-sm">
                Update your profile image
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Current Profile Preview */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-xl"
                    />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : userProfilePicture ? (
                  <div className="relative">
                    <img
                      src={userProfilePicture}
                      alt="Current Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-xl"
                    />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-amber-600 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Edit3 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className={`w-32 h-32 ${getRoleColor()} rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30 shadow-xl`}
                    >
                      {getInitials()}
                    </div>
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-amber-600 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              <p className={`text-center text-sm ${getSecondaryTextColor()}`}>
                {previewUrl
                  ? "New profile picture preview"
                  : userProfilePicture
                  ? "Current profile picture"
                  : "No profile picture set"}
              </p>
            </div>

            {/* File Info */}
            {selectedFile && (
              <div className={`mb-6 p-4 rounded-xl border ${getCardBackground()} transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <Upload className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${getTextColor()} truncate max-w-[180px]`}>
                        {selectedFile.name}
                      </div>
                      <div className={`text-xs ${getSecondaryTextColor()}`}>
                        {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-red-500 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
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
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 group hover:scale-[1.02] border ${getCardBackground()} hover:bg-amber-500 hover:text-white shadow-sm hover:shadow-md`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 group-hover:bg-white group-hover:text-amber-500' 
                        : 'bg-gray-100 group-hover:bg-white group-hover:text-amber-500'
                    }`}>
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${getTextColor()} group-hover:text-white`}>
                        Choose New Photo
                      </div>
                      <div className={`text-xs ${getSecondaryTextColor()} group-hover:text-white/80`}>
                        Select an image from your device
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  className="w-full bg-amber-500 text-white py-4 px-6 rounded-xl font-medium hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload Photo</span>
                  </>
                </button>
              )}

              {userProfilePicture && !selectedFile && (
                <button
                  onClick={handleRemovePicture}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 group hover:scale-[1.02] border ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 hover:bg-red-600/20 border-red-700'
                      : 'bg-white hover:bg-red-50 border-red-200'
                  } shadow-sm hover:shadow-md`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 group-hover:bg-red-500 group-hover:text-white' 
                        : 'bg-gray-100 group-hover:bg-red-500 group-hover:text-white'
                    }`}>
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      } group-hover:text-red-600 dark:group-hover:text-red-400`}>
                        Remove Current Photo
                      </div>
                      <div className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      } group-hover:text-red-500`}>
                        Delete your profile picture
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 border ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/70'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              } shadow-sm hover:shadow-md`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureModal;