import React, { useState } from 'react';
import { AlertTriangle, Ban, Lock, CheckCircle, XCircle, Mail, RefreshCw, Shield, X } from 'lucide-react';

const AccountStatusBanner = ({ 
  status, 
  theme, 
  userInfo,
  onClose,
  showCloseButton = false 
}) => {
  const [resending, setResending] = useState(false);
  
  const getStatusConfig = (status) => {
    switch (status) {
      case 'suspended':
        return {
          icon: <Ban className="w-6 h-6" />,
          title: "Account Suspended",
          message: "Your account has been suspended by an administrator.",
          color: "bg-red-100 border-l-4 border-red-500",
          darkColor: "dark:bg-red-900/30 dark:border-red-700",
          action: "Contact support to appeal",
          showContact: true,
          showResend: false,
          titleColor: "text-red-800 dark:text-red-300",
          textColor: "text-gray-900 dark:text-gray-200",
          secondaryTextColor: "text-gray-700 dark:text-gray-300"
        };
      case 'inactive':
        return {
          icon: <Lock className="w-6 h-6" />,
          title: "Account Inactive",
          message: "Your account is currently inactive and cannot be accessed.",
          color: "bg-yellow-100 border-l-4 border-yellow-500",
          darkColor: "dark:bg-yellow-900/30 dark:border-yellow-700",
          action: "Contact support to reactivate",
          showContact: true,
          showResend: false,
          titleColor: "text-yellow-800 dark:text-yellow-300",
          textColor: "text-gray-900 dark:text-gray-200",
          secondaryTextColor: "text-gray-700 dark:text-gray-300"
        };
      case 'unverified':
        return {
          icon: <AlertTriangle className="w-6 h-6" />,
          title: "Email Verification Required",
          message: "Please verify your email address to access your account.",
          color: "bg-blue-100 border-l-4 border-blue-500",
          darkColor: "dark:bg-blue-900/30 dark:border-blue-700",
          action: "Check your inbox for verification link",
          showContact: false,
          showResend: true,
          titleColor: "text-blue-800 dark:text-blue-300",
          textColor: "text-gray-900 dark:text-gray-200",
          secondaryTextColor: "text-gray-700 dark:text-gray-300"
        };
      case 'password_change_required':
        return {
          icon: <Shield className="w-6 h-6" />,
          title: "Password Change Required",
          message: "You must change your password before accessing the dashboard.",
          color: "bg-amber-100 border-l-4 border-amber-500",
          darkColor: "dark:bg-amber-900/30 dark:border-amber-700",
          action: "Change password now",
          showContact: false,
          showResend: false,
          titleColor: "text-amber-800 dark:text-amber-300",
          textColor: "text-gray-900 dark:text-gray-200",
          secondaryTextColor: "text-gray-700 dark:text-gray-300"
        };
      default:
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          title: "Account Active",
          message: "Your account is in good standing.",
          color: "bg-green-100 border-l-4 border-green-500",
          darkColor: "dark:bg-green-900/30 dark:border-green-700",
          action: null,
          showContact: false,
          showResend: false,
          titleColor: "text-green-800 dark:text-green-300",
          textColor: "text-gray-900 dark:text-gray-200",
          secondaryTextColor: "text-gray-700 dark:text-gray-300"
        };
    }
  };

  const config = getStatusConfig(status);

  const handleResendVerification = async () => {
    try {
      setResending(true);
      // Use the public endpoint for users who aren't logged in yet
      const response = await fetch('http://localhost:5000/api/auth/resend-verification-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userInfo?.email || '' // Pass the email from props
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Verification email sent successfully! Please check your inbox.');
      } else {
        alert(data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      alert('Error sending verification email. Please try again later.');
      console.error('Resend verification error:', error);
    } finally {
      setResending(false);
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@wubland.com';
  };

  if (status === 'active' && !showCloseButton) {
    return null; // Don't show banner for active accounts
  }

  return (
    <div className={`${config.color} ${config.darkColor} rounded-lg mb-6 shadow-lg transition-all duration-300 hover:shadow-xl`}>
      <div className="p-6">
        {/* Centered header with icon */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="mb-3">
            <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-black/20' : 'bg-white/50'}`}>
              {React.cloneElement(config.icon, {
                className: `w-8 h-8 ${config.titleColor}`
              })}
            </div>
          </div>
          
          <h3 className={`text-xl font-bold ${config.titleColor} mb-2`}>
            {config.title}
          </h3>
          
          <p className={`text-sm ${config.textColor} max-w-md mx-auto leading-relaxed`}>
            {config.message}
          </p>
        </div>

        {/* User info - centered */}
        {userInfo && (
          <div className="flex flex-col items-center mb-5">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-black/20' : 'bg-white/50'} ${config.secondaryTextColor} text-sm`}>
              <span className="font-medium">{userInfo.email}</span>
              <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>•</span>
              <span className={`font-semibold ${theme === 'dark' ? 'text-amber-300' : 'text-amber-600'}`}>
                {userInfo.role}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons - centered */}
        <div className="flex flex-col items-center space-y-3">
          {config.showResend && (
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-3 min-w-[220px] justify-center 
                ${resending 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 hover:scale-[1.02] active:scale-95'
                } text-white shadow-md hover:shadow-lg`}
            >
              {resending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Resend Verification Email
                </>
              )}
            </button>
          )}
          
          {config.showContact && (
            <button
              onClick={handleContactSupport}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center gap-3 min-w-[220px] justify-center shadow-md hover:shadow-lg"
            >
              <Mail className="w-5 h-5" />
              Contact Support Team
            </button>
          )}
          
          {config.action && !config.showResend && !config.showContact && (
            <div className={`text-center px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-black/20' : 'bg-white/50'}`}>
              <p className={`text-sm font-medium ${config.secondaryTextColor}`}>
                ⚠️ {config.action}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Close button - top right */}
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors 
            ${theme === 'dark' 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            }`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AccountStatusBanner;