// frontend/src/pages/admin/components/modals/EditUserModal.jsx
import React from "react";
import { X } from "lucide-react";

const EditUserModal = ({
  isOpen,
  onClose,
  editUser,
  setEditUser,
  theme,
  updateUser,
  isSuperAdmin = false,
  loading = false,
}) => {
  if (!isOpen || !editUser) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
    if (name === "role" && !value.includes("broker")) {
      setEditUser((prev) => ({ ...prev, broker_type: "" }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await updateUser(editUser);
  };

  const availableRoles = isSuperAdmin
    ? [
        "super_admin",
        "admin",
        "support_admin",
        "support_lead",
        "support_agent",
        "internal_broker",
        "external_broker",
        "buyer",
        "seller",
        "landlord",
        "renter",
        "user",
      ]
    : [
        "admin",
        "support_agent",
        "internal_broker",
        "external_broker",
        "buyer",
        "seller",
        "landlord",
        "renter",
        "user",
      ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`p-6 rounded-xl shadow-xl ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border max-w-md w-full`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Edit User
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${
              theme === "dark"
                ? "hover:bg-gray-700 text-white"
                : "hover:bg-gray-200 text-gray-900"
            }`}
            aria-label="Close modal"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <select
            name="privilege_tier"
            value={editUser.privilege_tier || ""}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            required
            disabled={loading}
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            name="role"
            value={editUser.role || ""}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            required
            disabled={loading}
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>

          {editUser.role && editUser.role.includes("broker") && (
            <select
              name="broker_type"
              value={editUser.broker_type || ""}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required
              disabled={loading}
            >
              <option value="internal">Internal Broker</option>
              <option value="external">External Broker</option>
            </select>
          )}

          <select
            name="status"
            value={editUser.status || ""}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            required
            disabled={loading}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 rounded-lg ${
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                "Confirm Edit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;