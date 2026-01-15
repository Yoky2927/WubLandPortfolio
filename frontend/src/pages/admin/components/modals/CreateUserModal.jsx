// frontend/src/pages/admin/components/modals/CreateUserModal.jsx
import React from "react";
import { X } from "lucide-react";
import PasswordStrengthIndicator from "../../../../components/PasswordStrengthIndicator";

const CreateUserModal = ({
  isOpen,
  onClose,
  theme,
  newUser,
  setNewUser,
  passwordStrength,
  passwordFeedback,
  createUser,
  checkPasswordStrength,
  isSuperAdmin = false,
  loading = false,
}) => {
  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      checkPasswordStrength(value);
    }
    if (name === "role" && !value.includes("broker")) {
      setNewUser((prev) => ({ ...prev, broker_type: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createUser();
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
        className={`p-6 rounded-xl shadow-xl border max-w-md w-full max-h-[90vh] overflow-y-auto ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Create New User
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.first_name}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.last_name}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.username}
            onChange={handleInputChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.email}
            onChange={handleInputChange}
            required
          />
          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
              value={newUser.password}
              onChange={handleInputChange}
              required
              minLength="8"
            />
            {newUser.password && (
              <PasswordStrengthIndicator
                strength={passwordStrength}
                feedback={passwordFeedback}
                theme={theme}
              />
            )}
          </div>
          <input
            type="text"
            name="phone"
            placeholder="Phone (optional)"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            value={newUser.phone}
            onChange={handleInputChange}
          />

          <select
            name="privilege_tier"
            value={newUser.privilege_tier}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            name="role"
            value={newUser.role}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            required
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

          {newUser.role.includes("broker") && (
            <select
              name="broker_type"
              value={newUser.broker_type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              required={newUser.role.includes("broker")}
            >
              <option value="internal">Internal Broker</option>
              <option value="external">External Broker</option>
            </select>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                newUser.password.length < 8 ||
                passwordStrength < 50 ||
                (newUser.role.includes("broker") && !newUser.broker_type)
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;