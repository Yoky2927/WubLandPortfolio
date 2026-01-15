// frontend/src/pages/admin/components/modals/ConfirmationModal.jsx
import React from "react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = "Confirm",
  confirmColor = "bg-blue-600",
  theme,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border max-w-md w-full transition-all duration-300`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mb-4 ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 rounded-lg ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
            } transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 ${confirmColor} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;