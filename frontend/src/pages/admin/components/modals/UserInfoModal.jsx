// frontend/src/components/UserInfoModal.jsx
import React from "react";
import { X } from "lucide-react";

const UserInfoModal = ({ isOpen, onClose, selectedUser, theme }) => {
  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border max-w-md w-full max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            User Details
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${
              theme === "dark"
                ? "hover:bg-gray-700 text-white"
                : "hover:bg-gray-200 text-gray-900"
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            {selectedUser.profile_picture ? (
              <img
                src={selectedUser.profile_picture}
                alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                className="w-20 h-20 rounded-full object-cover shadow-md"
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                  selectedUser.role === "super_admin"
                    ? "bg-red-500"
                    : selectedUser.role === "admin"
                    ? "bg-purple-500"
                    : "bg-blue-500"
                }`}
              >
                {`${selectedUser.first_name?.[0] || ""}${
                  selectedUser.last_name?.[0] || ""
                }`.toUpperCase()}
              </div>
            )}
          </div>
          <ul className="space-y-2">
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Full Name</span>
              <span>
                {selectedUser.first_name} {selectedUser.last_name}
              </span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Username</span>
              <span>{selectedUser.username || "N/A"}</span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Email</span>
              <span>{selectedUser.email}</span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Role</span>
              <span
                className={`px-2 py-1 rounded-full text-xs capitalize ${
                  selectedUser.role === "super_admin"
                    ? "bg-red-100 text-red-800"
                    : selectedUser.role === "admin"
                    ? "bg-purple-100 text-purple-800"
                    : selectedUser.role === "broker"
                    ? "bg-amber-100 text-amber-800"
                    : selectedUser.role === "support_agent"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {selectedUser.role}
              </span>
            </li>
            {selectedUser.role === "broker" && (
              <li
                className={`flex justify-between ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <span className="font-medium">Broker Type</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs capitalize ${
                    selectedUser.broker_type === "internal"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selectedUser.broker_type}
                </span>
              </li>
            )}
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedUser.status}
              </span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Phone</span>
              <span>{selectedUser.phone || "N/A"}</span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Joined</span>
              <span>
                {new Date(selectedUser.created_at).toLocaleDateString()}
              </span>
            </li>
            <li
              className={`flex justify-between ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span className="font-medium">Verified</span>
              <span>{selectedUser.verified ? "Yes" : "No"}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;