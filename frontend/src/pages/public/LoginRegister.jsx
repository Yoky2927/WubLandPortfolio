import { Link } from "react-router-dom";
import FloatingElements from "../../components/FloatingElements.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import { useState, useEffect, useRef } from "react";
import TermsModal from "../../components/TermsModel.jsx";
import Loader from "../../components/Loader.jsx";
import PasswordStrengthIndicator from "../../components/PasswordStrengthIndicator.jsx";
import ProfilePictureModal from "../../components/ProfilePictureModal.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import PasswordMismatchIndicator from "../../components/PasswordMismatchIndicator.jsx";
import AccountStatusBanner from "../../components/AccountStatusBanner.jsx";
import PasswordChangePopup from "../../components/PasswordChangePopup.jsx";

const LoginRegister = () => {
  // State for theme management (light/dark)
  const { theme, toggleTheme } = useTheme();

  // State for toggling between signup and login modes
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const [activeInput, setActiveInput] = useState(null);
  // Form data state for user inputs
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    retypePassword: "",
    accountType: "",
    acceptedTerms: false,
    newPassword: "",
    confirmPassword: "",
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfilePicture, setUserProfilePicture] = useState(null);
  const fileInputRef = useRef(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const [accountStatusData, setAccountStatusData] = useState(null);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [passwordChangeToken, setPasswordChangeToken] = useState(null);
  const [passwordChangeUserData, setPasswordChangeUserData] = useState(null);
  const [error, setError] = useState("");
  // State for tracking invalid (empty) fields during validation
  const [invalidFields, setInvalidFields] = useState([]);
  // State for showing success popup after signup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  const [loaderType, setLoaderType] = useState("loading");
  const [loaderMessage, setLoaderMessage] = useState("Loading...");

  // NEW: States for email verification and password change
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  // Check if user is already logged in (has token) and redirect based on role
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Decode the JWT token to get user role
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("🔍 Auto-redirect - User role:", payload.role);

        // Check if this is a password change token
        if (payload.requiresPasswordChange) {
          console.log("🔴 LoginRegister - Password change token found");
          // Don't redirect, show password change form
          setRequiresPasswordChange(true);
          setTempToken(token);
          return;
        }

        // Only redirect if it's a normal token without password change requirement
        setIsLoading(true);
        setTimeout(() => {
          if (payload.role === "super_admin") {
            console.log("🔄 Redirecting to Super Admin Dashboard...");
            window.location.href = "/super-admin-dashboard";
          } else if (payload.role === "admin") {
            console.log("🔄 Redirecting to Admin Dashboard...");
            window.location.href = "/admin-dashboard";
          } else if (payload.role === "support_agent") {
            console.log("🔄 Redirecting to Support Dashboard...");
            window.location.href = "/support-dashboard";
          } else {
            console.log("🔄 Redirecting to User Dashboard...");
            window.location.href = "/user-dashboard";
          }
        }, 3000);
      } catch (error) {
        console.error("❌ Error decoding token for auto-redirect:", error);
        // Fallback to homepage if token decoding fails
        setIsLoading(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 4000);
      }
    }
  }, []);

  // Handle acceptance of terms from modal
  const handleAcceptTerms = () => {
    setShowTermsModal(false);
    setFormData((prev) => ({ ...prev, acceptedTerms: true }));
  };

  // Handle rejection of terms from modal
  const handleRejectTerms = () => {
    setShowTermsModal(false);
    setFormData((prev) => ({ ...prev, acceptedTerms: false }));
  };

  // Real-time name validation - prevents numbers and special characters
  const validateNameInput = (value, fieldName) => {
    // Allow only letters, spaces, hyphens, and apostrophes
    return value === '' || /^[A-Za-z\s\-']+$/.test(value);
  };

  // Handle name input change with real-time validation
  const handleNameChange = (e) => {
    const { name, value } = e.target;

    // Validate the input
    if (validateNameInput(value, name)) {
      // Only update if valid
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // If invalid, don't update - input stays the same (prevents invalid characters)
  };

  // Generic input change handler for other fields
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special handling for name fields
    if (name === 'firstName' || name === 'lastName') {
      handleNameChange(e);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear invalid field highlight when user starts typing
    setInvalidFields((prev) => prev.filter((field) => field !== name));
  };

  // Handle password input to prevent paste
  const handlePasswordInput = (e, fieldName) => {
    // Allow backspace, delete, arrows, etc.
    if (e.key === 'Backspace' || e.key === 'Delete' ||
      e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
      e.key === 'Tab' || e.key === 'Escape' ||
      e.ctrlKey || e.metaKey) {
      return true;
    }

    // Get the current value and cursor position
    const currentValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // If pasting, prevent it
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      return false;
    }

    // Regular character input - allow it
    return true;
  };

  // Handle paste event on password fields
  const handlePasswordPaste = (e) => {
    e.preventDefault();
    return false;
  };

  // Calculate password strength and provide feedback
  const checkPasswordStrength = (password) => {
    let strength = 0;
    const feedback = [];
    if (password.length >= 8) strength += 25;
    else feedback.push("At least 8 characters");
    if (/[A-Z]/.test(password)) strength += 25;
    else feedback.push("Uppercase letter");
    if (/[0-9]/.test(password)) strength += 25;
    else feedback.push("Number");
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    else feedback.push("Special character");
    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  // Handle password input change with strength check
  const handlePasswordChange = (e) => {
    handleInputChange(e);
    if (isSignUpMode && e.target.name === "password") {
      checkPasswordStrength(e.target.value);
    }
  };

  // NEW: Handle password change for employees (old method - keeping for compatibility)
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    const { newPassword, confirmPassword } = formData;

    if (!newPassword || !confirmPassword) {
      setError("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setIsLoading(true);
      setLoaderType("loading");
      setLoaderMessage("Updating your password...");

      const response = await fetch(
        "http://localhost:5000/api/auth/change-required-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tempToken}`,
          },
          body: JSON.stringify({
            newPassword,
            confirmPassword,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLoaderType("success");
        setLoaderMessage("Password changed successfully!");

        // Clear the temp token and redirect to login
        setTimeout(() => {
          setRequiresPasswordChange(false);
          setTempToken("");
          setFormData({
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            password: "",
            retypePassword: "",
            accountType: "",
            acceptedTerms: false,
            newPassword: "",
            confirmPassword: "",
          });
          setIsLoading(false);
          setIsSignUpMode(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to change password");
        setLoaderType("error");
        setLoaderMessage("Password change failed!");
        setTimeout(() => setIsLoading(false), 2000);
      }
    } catch (error) {
      console.error("Password change error:", error);
      setError("Password change failed. Please try again.");
      setLoaderType("error");
      setLoaderMessage("Password change failed!");
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  // NEW: Resend verification email
  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      setLoaderType("loading");
      setLoaderMessage("Sending verification email...");

      const response = await fetch(
        "http://localhost:5000/api/auth/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: pendingVerificationEmail || formData.email,
          }),
        }
      );

      if (response.ok) {
        setLoaderType("success");
        setLoaderMessage("Verification email sent!");
        setEmailVerificationSent(true);
        setTimeout(() => setIsLoading(false), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to send verification email");
        setLoaderType("error");
        setLoaderMessage("Failed to send email");
        setTimeout(() => setIsLoading(false), 2000);
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setError("Failed to send verification email. Please try again.");
      setLoaderType("error");
      setLoaderMessage("Failed to send email");
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  // Handle profile picture upload (requires authentication token)
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }
    const formData = new FormData();
    formData.append("profilePicture", file);
    try {
      const response = await fetch("http://localhost:5000/api/profile/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfilePicture(data.profilePictureUrl);
        alert("Profile picture updated successfully!");
        setShowProfileModal(false);
      } else {
        alert("Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    }
  };

  // Handle social login/signup by redirecting to backend OAuth endpoint
  const handleSocialAuth = (platform) => {
    // Show a message that this feature is coming soon
    setError(
      `${platform.charAt(0).toUpperCase() + platform.slice(1)
      } authentication is coming soon!`
    );

    // Optional: Add a temporary delay to simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  // Handle form submission for both login and signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data:", formData);
    setError("");
    setInvalidFields([]);

    // Validate names before submission - ONLY for signup
    if (isSignUpMode) {
      // Check if names are empty
      if (!formData.firstName.trim()) {
        setError("First name is required");
        return;
      }
      if (!formData.lastName.trim()) {
        setError("Last name is required");
        return;
      }
    }

    // Debug: Check what accountType value is
    if (isSignUpMode) {
      console.log("Account Type:", formData.accountType);
    }

    // Define required fields based on mode
    const requiredFields = isSignUpMode
      ? [
        "firstName",
        "lastName",
        "username",
        "email",
        "password",
        "retypePassword",
        "accountType",
      ]
      : ["username", "password"];

    // Check for empty fields
    const emptyFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );
    if (emptyFields.length > 0) {
      setError("Please fill all required fields");
      setInvalidFields(emptyFields);

      // Highlight the accountType field if it's empty
      if (emptyFields.includes("accountType")) {
        const accountTypeElement = document.querySelector(
          'select[name="accountType"]'
        );
        if (accountTypeElement) {
          accountTypeElement.focus();
        }
      }
      return;
    }

    if (isSignUpMode) {
      // Additional checks for signup
      if (formData.password !== formData.retypePassword) {
        setError("Passwords do not match!");
        return;
      }
      if (!formData.acceptedTerms) {
        setError("Please accept the terms and conditions!");
        return;
      }

      try {
        setIsLoading(true);
        setLoaderType("loading");
        setLoaderMessage("Creating your account...");

        // Prepare data for registration - use the role mapping
        const signupData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.accountType, // Use the value directly (should be external_broker, seller, etc.)
        };

        // For external_broker, add broker_type
        if (formData.accountType === "external_broker") {
          signupData.broker_type = "external";
        }

        console.log("📤 Sending signup data:", signupData);

        const response = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(signupData),
        });

        console.log(
          "📊 Signup response status:",
          response.status,
          response.statusText
        );

        if (response.ok) {
          const data = await response.json();
          console.log("🔍 Full signup response data:", data);

          // Check if email verification is required
          if (data.requiresVerification || data.success) {
            setRequiresEmailVerification(true);
            setPendingVerificationEmail(formData.email);
            setLoaderType("success");
            setLoaderMessage("Registration successful! Please verify your email.");
            setTimeout(() => {
              setIsLoading(false);
            }, 3000);
            return; // Stop further execution
          }

          // If no verification required (admin-created accounts), proceed with normal flow
          console.log("🔍 Token in signup response:", data.token ? "Yes" : "No");

          // Set success loader
          setLoaderType("success");
          setLoaderMessage("Registration successful!");

          // Save token if it exists
          if (data.token) {
            localStorage.setItem("token", data.token);

            // ALSO save user data to localStorage for Home.jsx redirect
            const userData = {
              id: data.user?.id,
              first_name: data.user?.first_name || formData.firstName,
              last_name: data.user?.last_name || formData.lastName,
              username: data.user?.username || formData.username,
              email: data.user?.email || formData.email,
              role: data.user?.role || formData.accountType
            };

            localStorage.setItem("user", JSON.stringify(userData));
            console.log("✅ Token and user data saved to localStorage:", userData);
          } else {
            console.log("❌ No token in signup response data");
          }

          setTimeout(() => {
            setShowSuccessPopup(true);
            setTimeout(() => {
              setShowSuccessPopup(false);
              setIsSignUpMode(false);
              setFormData({
                firstName: "",
                lastName: "",
                username: "",
                email: "",
                password: "",
                retypePassword: "",
                accountType: "",
                acceptedTerms: false,
              });
              setIsLoading(false);
            }, 3000);
          }, 2000);
        } else {
          setIsLoading(false);
          console.log("❌ Signup failed with status:", response.status);

          // Try to get error message
          try {
            const errorData = await response.json();
            console.log("📝 Signup error details:", errorData);
            setError(
              `Registration failed: ${errorData.message || "Unknown error"}`
            );
          } catch (e) {
            console.log("📝 No signup error details available");
            setError("Registration failed. Please try again.");
          }

          setLoaderType("error");
          setLoaderMessage("Registration failed!");
          setTimeout(() => setIsLoading(false), 2000);
        }
      } catch (error) {
        setIsLoading(false);
        console.error("💥 Signup network error:", error);
        setError(
          "Registration failed. Please check your connection and try again."
        );
        setLoaderType("error");
        setLoaderMessage("Registration failed!");
        setTimeout(() => setIsLoading(false), 2000);
      }
    } else {
      // LOGIN SECTION - UPDATED WITH ACCOUNT STATUS HANDLING
      try {
        setIsLoading(true);
        setLoaderType("loading");
        setLoaderMessage("Signing you in...");

        console.log("🔄 Sending login request...");

        const response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        });

        console.log("📊 Login response status:", response.status);

        // Try to get response text first
        const responseText = await response.text();
        console.log("📄 Raw response text:", responseText);

        if (response.ok) {
          const data = JSON.parse(responseText);
          console.log("🔍 Parsed login response data:", data);

          // 🔴 NEW: Check for password change requirement
          if (data.requiresPasswordChange) {
            console.log("🔴 Password change required");
            setPasswordChangeToken(data.changePasswordToken);
            setPasswordChangeUserData(data.user || {
              email: formData.username,
              role: data.user?.role
            });
            setShowPasswordChangeModal(true);
            setLoaderType("info");
            setLoaderMessage("Password change required");
            setTimeout(() => setIsLoading(false), 1000);
            return;
          }

          // 🔴 NEW: Check for account status issues
          if (data.account_status && data.account_status !== 'active') {
            console.log("🔴 Account status issue:", data.account_status);
            setAccountStatus(data.account_status);
            setAccountStatusData({
              ...(data.user_info || data.user || {}),
              status_details: data.status_details
            });
            setLoaderType("warning");
            setLoaderMessage("Account issue detected");
            setTimeout(() => setIsLoading(false), 1000);
            return;
          }

          console.log("🔍 Token in response:", data.token ? "Yes" : "No");

          // Save token if it exists
          if (data.token) {
            localStorage.setItem("token", data.token);

            // ALSO save user data to localStorage for Home.jsx redirect
            const payload = JSON.parse(atob(data.token.split(".")[1]));
            const userData = {
              id: data.user?.id || payload.userId,
              first_name: data.user?.first_name || "User",
              last_name: data.user?.last_name || "",
              username: data.user?.username || payload.username,
              email: data.user?.email || "",
              role: data.user?.role || payload.role
            };

            localStorage.setItem("user", JSON.stringify(userData));
            console.log("✅ LoginRegister - Token and user data saved to localStorage:", userData);

            // Decode token to verify role
            try {
              console.log(
                "🔍 LoginRegister - Token payload after login:",
                payload
              );

              setLoaderType("success");
              setLoaderMessage("Login successful!");

              // Redirect based on role
              setTimeout(() => {
                console.log(
                  "🔄 LoginRegister - Starting redirect for role:",
                  payload.role
                );
                if (payload.role === "super_admin") {
                  console.log(
                    "🔄 LoginRegister - Redirecting to Super Admin Dashboard"
                  );
                  window.location.href = "/super-admin-dashboard";
                } else if (payload.role === "admin") {
                  console.log(
                    "🔄 LoginRegister - Redirecting to Admin Dashboard"
                  );
                  window.location.href = "/admin-dashboard";
                } else if (payload.role === "support_agent") {
                  console.log(
                    "🔄 LoginRegister - Redirecting to Support Dashboard"
                  );
                  window.location.href = "/support-dashboard";
                } else {
                  console.log("🔄 LoginRegister - Redirecting to homepage");
                  window.location.href = "/";
                }
              }, 3000);
            } catch (error) {
              console.error("❌ LoginRegister - Error decoding token:", error);
              setTimeout(() => {
                window.location.href = "/";
              }, 3000);
            }
          } else {
            console.log("❌ No token in login response data");
            setIsLoading(false);
            setError(
              "Login failed: No authentication token received from server"
            );
            setLoaderType("error");
            setLoaderMessage("Login failed!");
          }
        } else {
          setIsLoading(false);
          console.log("❌ Login failed with status:", response.status);

          // Try to get error message
          try {
            const errorData = JSON.parse(responseText);
            console.log("📝 Login error details:", errorData);

            // 🔴 NEW: Handle backend account status responses
            if (errorData.account_status) {
              setAccountStatus(errorData.account_status);
              setAccountStatusData(errorData.user_info || {
                email: formData.username
              });
              setLoaderType("warning");
              setLoaderMessage("Account issue detected");
              setTimeout(() => setIsLoading(false), 1000);
              return;
            }

            // Handle email verification requirement
            if (errorData.requiresVerification) {
              setRequiresEmailVerification(true);
              setPendingVerificationEmail(errorData.email || formData.username);
              setLoaderType("info");
              setLoaderMessage("Email verification required");
              setTimeout(() => setIsLoading(false), 2000);
              return;
            }

            setError(
              `Login failed: ${errorData.message || "Invalid credentials"}`
            );
          } catch (e) {
            console.log("📝 Login error (non-JSON):", responseText);
            setError(`Login failed: ${responseText || "Invalid credentials"}`);
          }

          setLoaderType("error");
          setLoaderMessage("Login failed!");
          setTimeout(() => setIsLoading(false), 2000);
        }
      } catch (error) {
        setIsLoading(false);
        console.error("💥 Login network error:", error);
        setError("Login failed. Please check your connection and try again.");
        setLoaderType("error");
        setLoaderMessage("Login failed!");
        setTimeout(() => setIsLoading(false), 2000);
      }
    }
  };

  // List of social platforms with SVG paths for icons
  const socialPlatforms = [
    {
      name: "facebook",
      color: "",
      hoverColor: "#f59e0b",
      svgPath: (
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      ),
    },
    {
      name: "twitter",
      color: "",
      hoverColor: "#f59e0b",
      svgPath: (
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      ),
    },
    {
      name: "google",
      color: "",
      hoverColor: "#f59e0b",
      svgPath: (
        <>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />{" "}
        </>
      ),
    },
    {
      name: "github",
      color: "",
      hoverColor: "#f59e0b",
      svgPath: (
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      ),
    },
  ];

  // NEW: Enhanced Email Verification Notice
  const EmailVerificationNotice = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-filter backdrop-blur-sm">
      <div
        className={`p-8 rounded-lg max-w-md w-full mx-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2
            className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"
              }`}
          >
            Email Verification Required
          </h2>
        </div>

        <p
          className={`mb-4 text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
        >
          We've sent a verification link to:
        </p>

        <div className={`text-center mb-6 p-3 rounded ${theme === "dark" ? "bg-gray-700" : "bg-amber-50"
          }`}>
          <strong className={`text-lg ${theme === "dark" ? "text-amber-400" : "text-amber-600"
            }`}>
            {pendingVerificationEmail || formData.email}
          </strong>
        </div>

        <p
          className={`mb-6 text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
        >
          Please check your inbox and click the verification link to activate your account.
          The link will expire in 24 hours.
        </p>

        <div className="space-y-4">
          {emailVerificationSent ? (
            <div className={`text-center p-3 rounded ${theme === "dark" ? "bg-green-900/30" : "bg-green-100"
              }`}>
              <p className={`text-green-600 font-semibold ${theme === "dark" ? "text-green-400" : "text-green-600"
                }`}>
                ✓ Verification email sent!
              </p>
              <p className={`text-sm mt-1 ${theme === "dark" ? "text-green-300" : "text-green-700"
                }`}>
                Check your inbox again
              </p>
            </div>
          ) : (
            <button
              onClick={handleResendVerification}
              className="w-full bg-amber-500 h-12 text-white font-semibold uppercase transition-all duration-300 hover:bg-amber-600 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resend Verification Email
            </button>
          )}

          <button
            onClick={() => {
              setRequiresEmailVerification(false);
              setPendingVerificationEmail("");
              setEmailVerificationSent(false);
              setIsSignUpMode(false);
              setFormData({
                firstName: "",
                lastName: "",
                username: "",
                email: "",
                password: "",
                retypePassword: "",
                accountType: "",
                acceptedTerms: false,
                newPassword: "",
                confirmPassword: "",
              });
            }}
            className={`w-full border-2 h-12 font-semibold uppercase transition-all duration-300 flex items-center justify-center ${theme === "dark"
              ? "border-amber-400 text-white hover:bg-amber-400 hover:text-gray-900"
              : "border-amber-500 text-gray-900 hover:bg-amber-500 hover:text-white"
              }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </button>
        </div>

        <div className={`mt-6 p-3 rounded text-sm ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
          }`}>
          <p className="text-center">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen flex items-center justify-center overflow-x-hidden transition-all duration-1000 ease-in-out relative 
      ${theme === "dark"
          ? "bg-gradient-to-r from-gray-900 via-black to-gray-900"
          : "bg-white"
        }`}
    >
      {isLoading && (
        <Loader theme={theme} message={loaderMessage} type={loaderType} />
      )}

      {/* NEW: Show email verification notice if required */}
      {requiresEmailVerification && <EmailVerificationNotice />}

      {/* Success popup for signup with blurred transparent background */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-filter backdrop-blur-sm">
          <div className="bg-transparent p-6 rounded-lg text-green-500 font-bold text-xl">
            You have registered successfully!
          </div>
        </div>
      )}

      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <FloatingElements theme={theme} reduced={true} />
      <TermsModal
        isOpen={showTermsModal}
        onClose={handleRejectTerms}
        onAccept={handleAcceptTerms}
        theme={theme}
      />

      {/* Circle instead of SVG rectangle - REDUCED TRANSPARENCY */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] transition-all duration-1000 ease-in-out z-0 rounded-full ${theme === "dark"
          ? "bg-gradient-to-r from-[#332500] to-[#1a1200]"
          : "bg-gradient-to-r from-amber-100 to-amber-200"
          }`}
        style={{
          opacity: 0.8, // Reduced transparency from 1 to 0.8
          transform: isSignUpMode
            ? "translateX(calc(50% - 100px)) translateY(-50%)"
            : "translateX(calc(-50% + 100px)) translateY(-50%)",
        }}
      />

      {/* Updated logo - LogoW.svg */}
      <img
        src="/vectors/LogoY.svg"
        alt="Logo"
        className="absolute top-6 left-6 md:top-8 md:left-8 w-60 h-60 md:w-44 md:h-44 sm:w-24 sm:h-24 z-50"
      />

      {/* Profile button and home link */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center space-x-4 z-50">
        <Link
          to="/"
          onClick={(e) => {
            e.preventDefault();
            setIsLoading(true);
            setTimeout(() => {
              window.location.href = "/";
            }, 4000);
          }}
          className="px-4 md:px-6 h-10 md:h-12 bg-amber-400 flex items-center justify-center shadow-lg hover:bg-amber-500 transition-all duration-300 group hover:scale-105 text-white hover:text-white text-sm md:text-base"
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110 -ml-1 md:-ml-2 mr-2 md:mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Go back Home
        </Link>
      </div>

      {/* Main container with better spacing */}
      <div className="relative w-full max-w-6xl mx-4 md:mx-8 lg:mx-auto px-2 md:px-4 lg:px-0 ">
        {/* Forms container - LIFTED UP (changed from 48% to 45%) */}
        <div
          className="absolute  top-[45%] left-1/2 transform  -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out z-30 pointer-events-auto w-full max-w-md md:max-w-lg"
          style={{
            left: isSignUpMode ? "calc(25% + 10px)" : "calc(75% - 10px)",
            top: isSignUpMode ? "-150px" : "10px"
          }}
        >
          {/* Login form */}
          <form
            onSubmit={handleSubmit}
            className={`flex flex-col items-center  justify-center px-4 md:px-6 lg:px-8 py-6 md:py-8 transition-all duration-300 ${isSignUpMode ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
          >
            <h2
              className={`text-2xl md:text-3xl font-bold mb-4 transition-colors duration-300 ${theme === "light" ? "text-gray-800" : "text-white"
                }`}
            >
              Sign in
            </h2>

            {/* Account Status Banner for Login */}
            {accountStatus && (
              <AccountStatusBanner
                status={accountStatus}
                theme={theme}
                userInfo={accountStatusData}
                onClose={() => {
                  setAccountStatus(null);
                  setAccountStatusData(null);
                }}
                showCloseButton={true}
              />
            )}

            <div
              className={`w-full my-3 h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${activeInput === "username"
                ? theme === "light"
                  ? "bg-amber-50 shadow-md"
                  : "bg-gray-700 shadow-md"
                : theme === "light"
                  ? "bg-gray-100 hover:bg-gray-200"
                  : "bg-gray-800 hover:bg-gray-700"
                } ${invalidFields.includes("username")
                  ? "border-2 border-red-500"
                  : ""
                }`}
              onFocus={() => setActiveInput("username")}
              onBlur={() => setActiveInput(null)}
            >
              <div className="flex items-center justify-center">
                <svg
                  className={`w-5 h-5 transition-colors duration-300 ${activeInput === "username"
                    ? "text-amber-600"
                    : "text-gray-400"
                    }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                className={`bg-transparent outline-none border-none text-sm md:text-base font-semibold placeholder-gray-500 transition-colors duration-300 ${theme === "light" ? "text-gray-700" : "text-white bg-gray-800"
                  }`}
              />
            </div>
            <div
              className={`w-full my-3 h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${activeInput === "password"
                ? theme === "light"
                  ? "bg-amber-50 shadow-md"
                  : "bg-gray-700 shadow-md"
                : theme === "light"
                  ? "bg-gray-100 hover:bg-gray-200"
                  : "bg-gray-800 hover:bg-gray-700"
                } ${invalidFields.includes("password")
                  ? "border-2 border-red-500"
                  : ""
                }`}
              onFocus={() => setActiveInput("password")}
              onBlur={() => setActiveInput(null)}
            >
              <div className="flex items-center justify-center">
                <svg
                  className={`w-5 h-5 transition-colors duration-300 ${activeInput === "password"
                    ? "text-amber-600"
                    : "text-gray-400"
                    }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className={`bg-transparent outline-none border-none text-sm md:text-base font-semibold placeholder-gray-500 transition-colors duration-300 ${theme === "light" ? "text-gray-700" : "text-white bg-gray-800"
                  }`}
              />
            </div>
            {error && (
              <p
                className={`text-sm ${theme === "light" ? "text-red-600" : "text-red-400"
                  }`}
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full max-w-xs bg-amber-500 h-12 text-white font-semibold uppercase my-4 cursor-pointer transition-all duration-300 hover:bg-amber-600 hover:scale-105 hover:shadow-lg"
            >
              Login
            </button>
            <p
              className={`text-xs md:text-sm my-3 md:my-4 transition-colors duration-300 ${theme === "light" ? "text-gray-600" : "text-gray-300"
                }`}
            >
              Or Sign in with social platforms
            </p>
            <div className="flex justify-center space-x-3 md:space-x-4 ">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleSocialAuth(platform.name)}
                  className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg ${theme === "light"
                    ? "border border-gray-300 hover:border-amber-500"
                    : "border border-gray-700 hover:border-amber-500"
                    }`}
                  style={{
                    backgroundColor: theme === "light" ? "white" : "#1f2937",
                    color: theme === "dark" ? "white" : "#1f2937",
                  }}
                  onMouseOver={(e) => {
                    if (platform.hoverColor)
                      e.currentTarget.style.color = platform.hoverColor;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = platform.color;
                  }}
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    {platform.svgPath}
                  </svg>
                </button>
              ))}
            </div>
          </form>

          {/* Signup form - REMOVED ROUNDED EDGES */}
          <form
            onSubmit={handleSubmit}
            className={`absolute top-0 left-0 w-full flex flex-col items-center justify-center px-4 md:px-6 lg:px-8 py-6 md:py-8 transition-all duration-300 ${isSignUpMode
              ? "opacity-100 z-2 pointer-events-auto"
              : "opacity-0 z-1 pointer-events-none"
              }`}
          >
            <h2
              className={`text-2xl md:text-3xl font-bold mb-6 transition-colors duration-300 ${theme === "light" ? "text-amber-500" : "text-white"
                }`}
            >
              Sign up
            </h2>

            {/* First Name with Validation - REMOVED rounded-lg */}
            <div className="w-full mb-4">
              <div
                className={`h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${activeInput === "firstName"
                  ? theme === "light"
                    ? "bg-amber-50 shadow-md ring-2 ring-amber-400"
                    : "bg-gray-700 shadow-md ring-2 ring-amber-400"
                  : theme === "light"
                    ? "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  } ${invalidFields.includes("firstName")
                    ? "border-2 border-red-500 ring-0"
                    : ""
                  }`}
                onFocus={() => setActiveInput("firstName")}
                onBlur={() => setActiveInput(null)}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-300 ${activeInput === "firstName"
                      ? "text-amber-600"
                      : "text-gray-400"
                      }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleNameChange}
                  className={`bg-transparent outline-none border-none text-sm md:text-base font-medium placeholder-gray-500 transition-colors duration-300 ${theme === "light" ? "text-gray-800" : "text-white"
                    }`}
                />
              </div>
            </div>

            {/* Last Name with Validation - REMOVED rounded-lg */}
            <div className="w-full mb-4">
              <div
                className={`h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${activeInput === "lastName"
                  ? theme === "light"
                    ? "bg-amber-50 shadow-md ring-2 ring-amber-400"
                    : "bg-gray-700 shadow-md ring-2 ring-amber-400"
                  : theme === "light"
                    ? "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  } ${invalidFields.includes("lastName")
                    ? "border-2 border-red-500 ring-0"
                    : ""
                  }`}
                onFocus={() => setActiveInput("lastName")}
                onBlur={() => setActiveInput(null)}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-300 ${activeInput === "lastName"
                      ? "text-amber-600"
                      : "text-gray-400"
                      }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleNameChange}
                  className={`bg-transparent outline-none border-none text-sm md:text-base font-medium placeholder-gray-500 transition-colors duration-300 ${theme === "light" ? "text-gray-800" : "text-white"
                    }`}
                />
              </div>
            </div>

            {/* Username - REMOVED rounded-lg */}
            <div className="w-full mb-4">
              <div
                className={`h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${activeInput === "username"
                  ? theme === "light"
                    ? "bg-amber-50 shadow-md ring-2 ring-amber-400"
                    : "bg-gray-700 shadow-md ring-2 ring-amber-400"
                  : theme === "light"
                    ? "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  } ${invalidFields.includes("username")
                    ? "border-2 border-red-500 ring-0"
                    : ""
                  }`}
                onFocus={() => setActiveInput("username")}
                onBlur={() => setActiveInput(null)}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className={`w-5 h-5 transition-colors duration-300 ${activeInput === "username"
                      ? "text-amber-600"
                      : "text-gray-400"
                      }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`bg-transparent outline-none border-none text-sm md:text-base font-medium placeholder-gray-500 transition-colors duration-300 ${theme === "light" ? "text-gray-800" : "text-white"
                    }`}
                />
              </div>
            </div>

            {/* Email - REMOVED rounded-lg */}
            <div className="w-full mb-4">
              <div
                className={`h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${activeInput === "email"
                  ? theme === "light"
                    ? "bg-amber-50 shadow-md ring-2 ring-amber-400"
                    : "bg-gray-700 shadow-md ring-2 ring-amber-400"
                  : theme === "light"
                    ? "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  } ${invalidFields.includes("email")
                    ? "border-2 border-red-500 ring-0"
                    : ""
                  }`}
                onFocus={() => setActiveInput("email")}
                onBlur={() => setActiveInput(null)}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className={`w-5 h-5 transition-colors duration-300 ${activeInput === "email" ? "text-amber-600" : "text-gray-400"
                      }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`bg-transparent outline-none border-none text-sm md:text-base font-medium placeholder-gray-500 transition-colors duration-300 ${theme === "light" ? "text-gray-800" : "text-white"
                    }`}
                />
              </div>
            </div>

            {/* Password with Anti-Copy-Paste - REMOVED rounded-lg */}
            <div className="w-full mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div
                    className={`h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${activeInput === "password"
                      ? theme === "light"
                        ? "bg-amber-50 shadow-md ring-2 ring-amber-400"
                        : "bg-gray-700 shadow-md ring-2 ring-amber-400"
                      : theme === "light"
                        ? "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                        : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      } ${invalidFields.includes("password")
                        ? "border-2 border-red-500 ring-0"
                        : ""
                      }`}
                    onFocus={() => setActiveInput("password")}
                    onBlur={() => setActiveInput(null)}
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-300 ${activeInput === "password"
                          ? "text-amber-600"
                          : "text-gray-400"
                          }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handlePasswordChange}
                      onKeyDown={(e) => handlePasswordInput(e, 'password')}
                      onPaste={handlePasswordPaste}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      className={`bg-transparent outline-none border-none text-sm md:text-base font-medium placeholder-gray-500 transition-colors duration-300 ${theme === "light" ? "text-gray-800" : "text-white"
                        }`}
                    />
                  </div>
                </div>

                <div>
                  <div
                    className={`h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${activeInput === "retypePassword"
                      ? theme === "light"
                        ? "bg-amber-50 shadow-md ring-2 ring-amber-400"
                        : "bg-gray-700 shadow-md ring-2 ring-amber-400"
                      : theme === "light"
                        ? "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                        : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                      } ${invalidFields.includes("retypePassword")
                        ? "border-2 border-red-500 ring-0"
                        : ""
                      }`}
                    onFocus={() => setActiveInput("retypePassword")}
                    onBlur={() => setActiveInput(null)}
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-300 ${activeInput === "retypePassword"
                          ? "text-amber-600"
                          : "text-gray-400"
                          }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      name="retypePassword"
                      placeholder="Confirm Password"
                      value={formData.retypePassword}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handlePasswordInput(e, 'retypePassword')}
                      onPaste={handlePasswordPaste}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      className={`bg-transparent outline-none border-none text-sm md:text-base font-medium placeholder-gray-500 transition-colors duration-300 ${theme === "light" ? "text-gray-800" : "text-white"
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-2">
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  For security, passwords must be typed manually (copy/paste disabled)
                </p>
              </div>
            </div>

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator
              strength={passwordStrength}
              feedback={passwordFeedback}
              theme={theme}
            />

            {/* Password Mismatch Indicator */}
            <PasswordMismatchIndicator
              password={formData.password}
              retypePassword={formData.retypePassword}
              isSignUpMode={isSignUpMode}
            />

            {/* Account Type */}
            <div className="w-full mb-4">
              <div
                className={`h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${activeInput === "accountType"
                  ? theme === "light"
                    ? "bg-amber-50 shadow-md ring-2 ring-amber-400"
                    : "bg-gray-700 shadow-md ring-2 ring-amber-400"
                  : theme === "light"
                    ? "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  } ${invalidFields.includes("accountType")
                    ? "border-2 border-red-500 ring-0"
                    : ""
                  }`}
                onFocus={() => setActiveInput("accountType")}
                onBlur={() => setActiveInput(null)}
              >
                <div className="flex items-center justify-center">
                  <svg
                    className={`w-5 h-5 transition-colors duration-300 ${activeInput === "accountType"
                      ? "text-amber-600"
                      : "text-gray-400"
                      }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className={`bg-transparent outline-none border-none text-sm md:text-base font-medium transition-colors duration-300 appearance-none cursor-pointer ${theme === "light"
                    ? formData.accountType ? "text-gray-800" : "text-gray-500"
                    : formData.accountType ? "text-white" : "text-gray-400"
                    }`}
                >
                  <option value="" className={theme === "light" ? "text-gray-800" : "text-white"}>
                    Select Account Type
                  </option>
                  {/* CLIENT ROLES - available for self-registration */}
                  <option value="external_broker" className={theme === "light" ? "text-gray-800" : "text-white"}>
                    Broker (External)
                  </option>
                  <option value="seller" className={theme === "light" ? "text-gray-800" : "text-white"}>
                    Seller
                  </option>
                  <option value="buyer" className={theme === "light" ? "text-gray-800" : "text-white"}>
                    Buyer
                  </option>
                  <option value="landlord" className={theme === "light" ? "text-gray-800" : "text-white"}>
                    Landlord
                  </option>
                  <option value="renter" className={theme === "light" ? "text-gray-800" : "text-white"}>
                    Renter
                  </option>
                  <option value="user" className={theme === "light" ? "text-gray-800" : "text-white"}>
                    General User
                  </option>
                </select>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="w-full mb-6">
              <div className="flex items-center my-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptedTerms"
                    checked={formData.acceptedTerms}
                    onChange={() => {
                      if (!formData.acceptedTerms) setShowTermsModal(true);
                      else
                        setFormData((prev) => ({
                          ...prev,
                          acceptedTerms: false,
                        }));
                    }}
                    className="hidden"
                  />
                  <div
                    className={`w-5 h-5 border-2 flex items-center justify-center mr-3 transition-all duration-300 ${formData.acceptedTerms
                      ? "bg-amber-500 border-amber-500"
                      : theme === "light"
                        ? "border-gray-300 hover:border-amber-400"
                        : "border-gray-600 hover:border-amber-400"
                      }`}
                  >
                    {formData.acceptedTerms && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors duration-300 ${theme === "light" ? "text-gray-700" : "text-gray-300"
                      }`}
                  >
                    I agree to the{" "}
                    <button
                      type="button"
                      className="text-amber-500 hover:text-amber-600 font-medium underline"
                      onClick={() => setShowTermsModal(true)}
                    >
                      Terms and Conditions
                    </button>
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full h-12 text-white font-bold uppercase my-2 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl ${formData.acceptedTerms
                ? "bg-amber-500 hover:bg-amber-600 hover:scale-[1.02]"
                : "bg-gray-400 cursor-not-allowed"
                } text-sm md:text-base`}
              disabled={!formData.acceptedTerms}
            >
              {formData.acceptedTerms ? "Create Account" : "Accept Terms to Continue"}
            </button>

            {/* Error Message */}
            {error && (
              <div className="w-full mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className={`text-sm font-medium ${theme === "light" ? "text-red-700" : "text-red-300"
                  }`}>
                  {error}
                </p>
              </div>
            )}

            {/* Social Signup */}
            <div className="w-full mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p
                className={`text-sm text-center mb-4 transition-colors duration-300 ${theme === "light" ? "text-gray-600" : "text-gray-300"
                  }`}
              >
                Or sign up with
              </p>
              <div className="flex justify-center space-x-4">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handleSocialAuth(platform.name)}
                    className={`w-10 h-10 flex items-center justify-center transition-all duration-300 ${theme === "light"
                      ? "bg-gray-100 border border-gray-300 hover:bg-amber-50 hover:border-amber-400"
                      : "bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-amber-500"
                      } hover:scale-110 hover:shadow-lg`}
                    title={`Sign up with ${platform.name}`}
                  >
                    <svg
                      className={`w-5 h-5 ${theme === "light" ? "text-gray-700" : "text-gray-300"
                        }`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      {platform.svgPath}
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Left side content (New here?) */}
        <div className="hidden md:flex absolute top-1/2 left-0 transform -translate-y-1/2 w-1/2 px-4 lg:px-8 xl:px-12 z-20">
          <div className="flex flex-col items-end justify-center text-right pr-4 lg:pr-8 xl:pr-12">
            <div
              className={`transition-transform duration-700 ${theme === "light" ? "text-gray-800" : "text-white"
                }`}
              style={{
                transform: isSignUpMode
                  ? "translateX(-100%)"
                  : "translateX(0)",
                opacity: isSignUpMode ? 0 : 1,
              }}
            >
              <h3 className="text-xl lg:text-2xl font-semibold mb-2">
                New here?
              </h3>
              <p className="text-sm lg:text-base mb-4 max-w-xs lg:max-w-sm">
                Join our community and discover amazing properties!
              </p>
              <button
                onClick={() => setIsSignUpMode(true)}
                className={`border-2 bg-transparent w-28 lg:w-32 h-10 lg:h-12 font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 ${theme === "light"
                  ? "border-amber-500 text-gray-900 hover:bg-amber-500 hover:text-white"
                  : "border-amber-400 text-white hover:bg-amber-400 hover:text-gray-900"
                  }`}
              >
                Sign up
              </button>
            </div>
            <img
              src="/vectors/Login.svg"
              alt="Login"
              className="w-full max-w-sm lg:max-w-md transition-transform duration-700"
              style={{
                transform: isSignUpMode
                  ? "translateX(-100%)"
                  : "translateX(0)",
                opacity: isSignUpMode ? 0 : 1,
              }}
            />
          </div>
        </div>

        {/* Right side content (One of us?) */}
        <div className="hidden md:flex absolute top-1/2 right-0 transform -translate-y-1/2 w-1/2 px-4 lg:px-8 xl:px-12 z-20">
          <div className="flex flex-col items-start justify-center text-left pl-4 lg:pl-8 xl:pl-12">
            <div
              className={`transition-transform duration-700 ${theme === "light" ? "text-gray-800" : "text-white"
                }`}
              style={{
                transform: isSignUpMode ? "translateX(0)" : "translateX(100%)",
                opacity: isSignUpMode ? 1 : 0,
              }}
            >
              <h3 className="text-xl lg:text-2xl font-semibold mb-2">
                One of us?
              </h3>
              <p className="text-sm lg:text-base mb-4 max-w-xs lg:max-w-sm">
                Welcome back! Sign in to continue your journey.
              </p>
              <button
                onClick={() => setIsSignUpMode(false)}
                className={`border-2 bg-transparent w-28 lg:w-32 h-10 lg:h-12 font-semibold text-sm lg:text-base transition-all duration-300 hover:scale-105 ${theme === "light"
                  ? "border-amber-500 text-gray-900 hover:bg-amber-500 hover:text-white"
                  : "border-amber-400 text-white hover:bg-amber-400 hover:text-gray-900"
                  }`}
              >
                Login
              </button>
            </div>
            <img
              src="/vectors/Signup.svg"
              alt="Register"
              className="w-full max-w-sm lg:max-w-md transition-transform duration-700"
              style={{
                transform: isSignUpMode ? "translateX(0)" : "translateX(100%)",
                opacity: isSignUpMode ? 1 : 0,
              }}
            />
          </div>
        </div>

        {/* Mobile toggle buttons */}
        <div className="md:hidden flex justify-center mt-8 z-30 relative">
          <button
            onClick={() => setIsSignUpMode(!isSignUpMode)}
            className={`border-2 bg-transparent px-6 py-2 font-semibold text-sm transition-all duration-300 ${theme === "light"
              ? "border-amber-500 text-gray-900 hover:bg-amber-500 hover:text-white"
              : "border-amber-400 text-white hover:bg-amber-400 hover:text-gray-900"
              }`}
          >
            {isSignUpMode ? "Already have an account? Login" : "New here? Sign up"}
          </button>
        </div>
      </div>

      {/* Profile picture modal (only accessible after login, as page redirects if logged in) */}
      <ProfilePictureModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpload={handleProfilePictureUpload}
        userProfilePicture={userProfilePicture}
        theme={theme}
        fileInputRef={fileInputRef}
      />

      {/* Add Password Change Popup */}
      {showPasswordChangeModal && (
        <PasswordChangePopup
          isOpen={showPasswordChangeModal}
          onClose={() => setShowPasswordChangeModal(false)}
          theme={theme}
          token={passwordChangeToken}
          userData={passwordChangeUserData}
          onSuccess={(response) => {
            // Store new token and user data
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Show success message
            setLoaderType("success");
            setLoaderMessage("Password changed successfully!");

            // Redirect based on role
            setTimeout(() => {
              const payload = JSON.parse(atob(response.token.split('.')[1]));
              if (payload.role === "super_admin") {
                window.location.href = "/super-admin-dashboard";
              } else if (payload.role === "admin") {
                window.location.href = "/admin-dashboard";
              } else if (payload.role === "support_agent") {
                window.location.href = "/support-dashboard";
              } else {
                window.location.href = "/";
              }
            }, 2000);
          }}
          isRequiredChange={true}
        />
      )}
    </div>
  );
};

export default LoginRegister;