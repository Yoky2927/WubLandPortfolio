// src/components/PasswordChangePopup.jsx
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, X, AlertCircle, Shield } from 'lucide-react';
import { api } from '../utils/api.endpoints';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import PasswordMismatchIndicator from './PasswordMismatchIndicator';

const PasswordChangePopup = ({ 
  isOpen, 
  onClose, 
  theme, 
  token, 
  userData, 
  onSuccess,
  isRequiredChange = true 
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (pass) => {
    let strength = 0;
    const feedback = [];
    
    if (pass.length >= 8) strength += 25;
    else feedback.push("at least 8 characters");
    
    if (/\d/.test(pass)) strength += 25;
    else feedback.push("at least one number");
    
    if (/[A-Z]/.test(pass)) strength += 25;
    else feedback.push("at least one uppercase letter");
    
    if (/[a-z]/.test(pass)) strength += 25;
    else feedback.push("at least one lowercase letter");
    
    if (/[!@#$%^&*]/.test(pass)) strength += 25;
    else feedback.push("at least one special character");
    
    // Cap at 100%
    strength = Math.min(strength, 100);
    
    return { strength, feedback };
  };

  const passwordStrength = calculatePasswordStrength(password);

  const validateForm = () => {
    const newErrors = {};
    
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirm = "Passwords do not match";
    }
    
    if (passwordStrength.strength < 75) {
      newErrors.strength = "Password is not strong enough";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let response;
      
      if (isRequiredChange && token) {
        // Force change password (for admin-created users)
        response = await api.post('FORCE_CHANGE_PASSWORD', {
          passwordChangeToken: token,
          newPassword: password,
          confirmPassword: confirmPassword
        });
      } else {
        // Regular password change
        response = await api.post('CHANGE_REQUIRED_PASSWORD', {
          newPassword: password,
          confirmPassword: confirmPassword
        });
      }

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess(response);
          if (onClose) onClose();
        }, 2000);
      } else {
        setErrors({ general: response.message || "Failed to change password" });
      }
    } catch (error) {
      setErrors({ 
        general: error.message || "Network error occurred. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isRequiredChange) {
      // If this is required, show warning
      if (window.confirm("You must change your password to continue. Are you sure you want to cancel?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login-register';
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl max-w-md w-full max-h-[90vh] overflow-auto ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      } shadow-2xl`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isRequiredChange 
                  ? "bg-amber-100 dark:bg-amber-900/30" 
                  : "bg-blue-100 dark:bg-blue-900/30"
              }`}>
                {isRequiredChange ? (
                  <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isRequiredChange ? 'Change Your Password' : 'Update Password'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userData?.email ? `For: ${userData.email}` : 
                   isRequiredChange ? 'First-time login requires password change' : 'Update your account password'}
                </p>
              </div>
            </div>
            {!isRequiredChange && (
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {success ? (
            /* Success State */
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Password Changed!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your password has been updated successfully.
              </p>
              <div className="animate-pulse">
                <p className="text-sm text-gray-500">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              {isRequiredChange && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>Note:</strong> This is a required password change. 
                    You must create a strong password to continue.
                  </p>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-4 pr-10 py-3 rounded-lg border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } ${errors.password ? "border-red-500" : ""}`}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">{errors.password}</p>
                )}
                
                {/* Password Strength Indicator */}
                {password && (
                  <PasswordStrengthIndicator
                    strength={passwordStrength.strength}
                    feedback={passwordStrength.feedback}
                    theme={theme}
                  />
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-4 pr-10 py-3 rounded-lg border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } ${errors.confirm ? "border-red-500" : ""}`}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordMismatchIndicator
                  password={password}
                  retypePassword={confirmPassword}
                  isSignUpMode={true}
                />
                {errors.confirm && (
                  <p className="mt-2 text-sm text-red-500">{errors.confirm}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-medium mb-2">Password Requirements:</h4>
                <ul className="text-sm space-y-1">
                  <li className={`flex items-center ${password.length >= 8 ? 'text-green-500' : 'text-gray-500'}`}>
                    <span className="mr-2">•</span>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center ${/\d/.test(password) ? 'text-green-500' : 'text-gray-500'}`}>
                    <span className="mr-2">•</span>
                    At least one number
                  </li>
                  <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-500'}`}>
                    <span className="mr-2">•</span>
                    At least one uppercase letter
                  </li>
                  <li className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-500'}`}>
                    <span className="mr-2">•</span>
                    At least one lowercase letter
                  </li>
                  <li className={`flex items-center ${/[!@#$%^&*]/.test(password) ? 'text-green-500' : 'text-gray-500'}`}>
                    <span className="mr-2">•</span>
                    At least one special character (!@#$%^&*)
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {isRequiredChange ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className={`flex-1 py-3 rounded-lg font-medium ${
                        theme === "dark"
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      Cancel & Logout
                    </button>
                    <button
                      type="submit"
                      disabled={loading || passwordStrength.strength < 75 || password !== confirmPassword}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Changing Password...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className={`flex-1 py-3 rounded-lg font-medium ${
                        theme === "dark"
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || passwordStrength.strength < 75 || password !== confirmPassword}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordChangePopup;