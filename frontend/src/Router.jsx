// Router.jsx - COMPLETE UPDATE
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { SystemSettingsProvider } from "./contexts/SystemSettingsContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import App from "./App.jsx";
import DocumentValidator from "./pages/shared/DocumentValidator.jsx";
import LoginRegister from "./pages/public/LoginRegister.jsx";
import Home from "./pages/public/Home.jsx";
import Properties from "./pages/public/Properties.jsx";
import DebugAuth from "./pages/public/DebugAuth.jsx";
import SellerLeaser from "./pages/public/SellerLeaser.jsx";

// Import dashboard pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import SupportAgentsDashboard from "./pages/support/SupportAgentsDashboard.jsx";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard.jsx";
import MaintenancePage from "./components/MaintenancePage";
import InternalBrokerDashboard from "./pages/broker/InternalBrokerDashboard.jsx";
import ExternalBrokerDashboard from "./pages/broker/ExternalBrokerDashboard.jsx";

// Import hooks
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// User Dashboard Component
const UserDashboard = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  let userInfo = { first_name: "User", last_name: "", role: "user" };

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userInfo = {
        first_name: payload.first_name || "User",
        last_name: payload.last_name || "",
        role: payload.role || "user",
      };
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  // Redirect sellers and leasers to the seller-leaser page
  useEffect(() => {
    if (userInfo.role === 'seller' || userInfo.role === 'leaser') {
      navigate('/seller-leaser', { replace: true });
    }
  }, [userInfo.role, navigate]);

  // Only show this for buyers, renters, and generic users
  if (userInfo.role === 'seller' || userInfo.role === 'leaser') {
    return null; // They'll be redirected
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold">
        Welcome, {userInfo.first_name} {userInfo.last_name}!
      </h1>
      <p className="text-lg mb-4">
        Your role is: <strong>{userInfo.role}</strong>
      </p>
      <p>
        This is your user dashboard. Specific features for your role will be
        available here.
      </p>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/";
        }}
        className="mt-6 bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
      >
        Logout
      </button>
    </div>
  );
};

// IMPROVED Protected Route - Check token and extract role
const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");

  console.log("🔐 ProtectedRoute - Token exists:", !!token);
  console.log("🔐 Required role:", requiredRole);
  console.log("🔐 Allowed roles:", allowedRoles);

  if (!token) {
    console.log("🔐 No token, redirecting to login");
    return <Navigate to="/login-register" replace />;
  }

  // Decode token to get user info
  let userRole = null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userRole = payload.role;
    console.log("🔐 ProtectedRoute - User role from token:", userRole);
  } catch (error) {
    console.error("❌ Error decoding token:", error);
    localStorage.removeItem("token");
    return <Navigate to="/login-register" replace />;
  }

  // Check if user has required role (if specified)
  if (requiredRole && userRole !== requiredRole) {
    console.log(
      `🔐 Access DENIED - Required: ${requiredRole}, User has: ${userRole}`
    );
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user has one of allowed roles (if specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log(
      `🔐 Access DENIED - Allowed: ${allowedRoles.join(", ")}, User has: ${userRole}`
    );
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("🔐 Access GRANTED - Token valid, role:", userRole);
  return children;
};

// Role-Based Route - Automatically redirects to correct dashboard
const RoleBasedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login-register" replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userRole = payload.role;

    console.log("🔄 RoleBasedRoute - User role:", userRole);

    // Redirect based on role
    switch (userRole) {
      case "super_admin":
        return <Navigate to="/super-admin-dashboard" replace />;
      case "admin":
        return <Navigate to="/admin-dashboard" replace />;
      case "support_agent":
      case "support_lead":
      case "support_admin":
        return <Navigate to="/support-dashboard" replace />;
      case "internal_broker":
        return <Navigate to="/internal-broker-dashboard" replace />;
      case "external_broker":
        return <Navigate to="/external-broker-dashboard" replace />;
      case "seller":
      case "leaser":
        return <Navigate to="/seller-leaser" replace />;
      default:
        return <Navigate to="/user-dashboard" replace />;
    }
  } catch (error) {
    console.error("❌ Error decoding token in RoleBasedRoute:", error);
    localStorage.removeItem("token");
    return <Navigate to="/login-register" replace />;
  }
};

// Maintenance Wrapper Component
const MaintenanceWrapper = ({ children }) => {
  const maintenanceSettings = JSON.parse(
    localStorage.getItem("maintenanceSettings") || '{"enabled":false}'
  );

  // Get user role from token
  const getUserRole = () => {
    const token = localStorage.getItem("token");
    if (!token) return "user";

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role || "user";
    } catch (error) {
      return "user";
    }
  };

  const currentUserRole = getUserRole();

  // Check if user can bypass maintenance
  const canUserBypassMaintenance = (role) => {
    const bypassRoles = ["super_admin", "admin", "internal_broker", "external_broker"];
    return bypassRoles.includes(role);
  };

  // If maintenance is active and user cannot bypass, show maintenance page
  if (
    maintenanceSettings.enabled &&
    !canUserBypassMaintenance(currentUserRole)
  ) {
    return <MaintenancePage theme="light" />;
  }

  return children;
};

// Public Route with Maintenance Check
const PublicRoute = ({ children }) => {
  const maintenanceSettings = JSON.parse(
    localStorage.getItem("maintenanceSettings") || '{"enabled":false}'
  );

  // For public routes, only show maintenance page if user is logged in but not admin
  const token = localStorage.getItem("token");
  if (token && maintenanceSettings.enabled) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userRole = payload.role || "user";

      // Only show maintenance page to non-admin users
      if (userRole !== "super_admin" && userRole !== "admin") {
        return <MaintenancePage theme="light" />;
      }
    } catch (error) {
      // If token is invalid, allow access to public routes
    }
  }

  return children;
};

// Simple unauthorized page
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        Unauthorized Access
      </h1>
      <p className="text-gray-700 mb-4">
        You don't have permission to access this page.
      </p>
      <div className="space-x-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
        >
          Go Home
        </button>
        <button
          onClick={() => (window.location.href = "/debug-auth")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Debug Auth
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login-register";
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout & Login Again
        </button>
      </div>
    </div>
  </div>
);

function Router() {
  console.log("🔄 Router rendering - Current path:", window.location.pathname);

  return (
    <ThemeProvider>
      <ToastProvider>
        <SystemSettingsProvider>
          <Routes>
            {/* Public Routes with Maintenance Check */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <App />
                </PublicRoute>
              }
            >
              <Route
                index
                element={
                  <PublicRoute>
                    <Home />
                  </PublicRoute>
                }
              />
              <Route
                path="/properties"
                element={
                  <PublicRoute>
                    <Properties />
                  </PublicRoute>
                }
              />
              <Route
                path="login-register"
                element={
                  <PublicRoute>
                    <LoginRegister />
                  </PublicRoute>
                }
              />
              <Route
                path="seller-leaser"
                element={
                  <PublicRoute>
                    <SellerLeaser />
                  </PublicRoute>
                }
              />
            </Route>

            {/* Debug Route - Always accessible */}
            <Route path="/debug-auth" element={<DebugAuth />} />

            {/* Auto-Redirect Route - After login, goes to correct dashboard */}
            <Route path="/dashboard" element={<RoleBasedRoute />} />

            {/* Shared Routes with Maintenance Check */}
            <Route
              path="/document-validator"
              element={
                <MaintenanceWrapper>
                  <DocumentValidator />
                </MaintenanceWrapper>
              }
            />

            {/* ======================== */}
            {/* DASHBOARD ROUTES */}
            {/* ======================== */}

            {/* Super Admin Dashboard */}
            <Route
              path="/super-admin-dashboard"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <MaintenanceWrapper>
                    <SuperAdminDashboard />
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MaintenanceWrapper>
                    <AdminDashboard />
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />

            {/* Support Dashboard */}
            <Route
              path="/support-dashboard"
              element={
                <ProtectedRoute allowedRoles={["support_agent", "support_lead", "support_admin"]}>
                  <MaintenanceWrapper>
                    <SupportAgentsDashboard />
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />

            {/* ======================== */}
            {/* BROKER DASHBOARD ROUTES */}
            {/* ======================== */}

            {/* Internal Broker Dashboard */}
            <Route
              path="/internal-broker-dashboard"
              element={
                <ProtectedRoute requiredRole="internal_broker">
                  <MaintenanceWrapper>
                    <InternalBrokerDashboard />
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />

            {/* External Broker Dashboard */}
            <Route
              path="/external-broker-dashboard"
              element={
                <ProtectedRoute requiredRole="external_broker">
                  <MaintenanceWrapper>
                    <ExternalBrokerDashboard />
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />

            {/* ======================== */}
            {/* USER DASHBOARD ROUTES */}
            {/* ======================== */}

            {/* Generic User Dashboard (for buyers, renters, landlords) */}
            <Route
              path="/user-dashboard"
              element={
                <ProtectedRoute allowedRoles={["user", "buyer", "renter", "landlord"]}>
                  <MaintenanceWrapper>
                    <UserDashboard />
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />

            {/* ======================== */}
            {/* ERROR ROUTES */}
            {/* ======================== */}

            {/* Unauthorized Page */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Maintenance Test Route */}
            <Route
              path="/maintenance-test"
              element={<MaintenancePage theme="light" />}
            />

            {/* Analysis Service Test Page */}
            <Route
              path="/analysis-test"
              element={
                <div className="min-h-screen bg-gray-100 p-6">
                  <h1 className="text-3xl font-bold mb-6">Analysis Service Test</h1>
                  <div className="space-y-4">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('http://localhost:5004/api/analytics/health');
                          const data = await response.json();
                          alert(`Status: ${data.status}\nService: ${data.service}`);
                        } catch (error) {
                          alert(`Error: ${error.message}`);
                        }
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Test Analysis Service Health
                    </button>
                    
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('http://localhost:5004/api/analytics/dashboard');
                          const data = await response.json();
                          console.log('Dashboard Data:', data);
                          alert(`Data loaded: ${Object.keys(data).length} keys`);
                        } catch (error) {
                          alert(`Error: ${error.message}`);
                        }
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                      Test Dashboard Analytics
                    </button>
                    
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('http://localhost:5004/api/analytics/test/connectivity');
                          const data = await response.json();
                          console.log('Connectivity Data:', data);
                          alert(`Services: ${data.connectivity.length}`);
                        } catch (error) {
                          alert(`Error: ${error.message}`);
                        }
                      }}
                      className="bg-purple-500 text-white px-4 py-2 rounded"
                    >
                      Test Service Connectivity
                    </button>
                  </div>
                </div>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SystemSettingsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default Router;