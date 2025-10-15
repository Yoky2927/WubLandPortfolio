// Router.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { SystemSettingsProvider } from "./contexts/SystemSettingsContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import App from "./App.jsx";
import DocumentValidator from "./pages/shared/DocumentValidator.jsx";
import LoginRegister from "./pages/public/LoginRegister.jsx";
import Home from "./pages/public/Home.jsx";
import DebugAuth from "./pages/public/DebugAuth.jsx";

import MaintenancePage from './components/MaintenancePage';

// Import dashboard pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import SupportAgentsDashboard from './pages/support/SupportAgentsDashboard.jsx';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard.jsx';

// User Dashboard Component
const UserDashboard = () => {
  const token = localStorage.getItem('token');
  let userInfo = { first_name: 'User', last_name: '', role: 'user' };
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userInfo = {
        first_name: payload.first_name || 'User',
        last_name: payload.last_name || '',
        role: payload.role || 'user'
      };
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold">
        Welcome, {userInfo.first_name} {userInfo.last_name}!
      </h1>
      <p className="text-lg mb-4">Your role is: <strong>{userInfo.role}</strong></p>
      <p>This is your user dashboard. Specific features for your role will be available here.</p>
      
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/';
        }}
        className="mt-6 bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
      >
        Logout
      </button>
    </div>
  );
};

// ULTRA SIMPLE Protected Route - Just check token exists
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  console.log("🔐 ProtectedRoute - Token exists:", !!token);
  
  if (!token) {
    console.log("🔐 No token, redirecting to login");
    return <Navigate to="/login-register" replace />;
  }
  
  console.log("🔐 Access GRANTED - Token found");
  return children;
};

// Maintenance Wrapper Component
const MaintenanceWrapper = ({ children, userRole = 'user' }) => {
  const maintenanceSettings = JSON.parse(localStorage.getItem('maintenanceSettings') || '{"enabled":false}');
  
  // Get user role from token
  const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return 'user';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || 'user';
    } catch (error) {
      return 'user';
    }
  };

  const currentUserRole = userRole === 'auto' ? getUserRole() : userRole;

  // Check if user can bypass maintenance
  const canUserBypassMaintenance = (role) => {
    return role === 'super_admin' || role === 'admin';
  };

  // If maintenance is active and user cannot bypass, show maintenance page
  if (maintenanceSettings.enabled && !canUserBypassMaintenance(currentUserRole)) {
    return <MaintenancePage theme="light" />;
  }
  
  return children;
};

// Public Route with Maintenance Check
const PublicRoute = ({ children }) => {
  const maintenanceSettings = JSON.parse(localStorage.getItem('maintenanceSettings') || '{"enabled":false}');
  
  // For public routes, only show maintenance page if user is logged in but not admin
  const token = localStorage.getItem('token');
  if (token && maintenanceSettings.enabled) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role || 'user';
      
      // Only show maintenance page to non-admin users
      if (userRole !== 'super_admin' && userRole !== 'admin') {
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
      <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
      <p className="text-gray-700 mb-4">You don't have permission to access this page.</p>
      <div className="space-x-4">
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
        >
          Go Home
        </button>
        <button 
          onClick={() => window.location.href = '/debug-auth'}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Debug Auth
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login-register';
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
  return (
    <ThemeProvider>
      <ToastProvider>
        <SystemSettingsProvider>
          <Routes>
            {/* Public Routes with Maintenance Check */}
            <Route path="/" element={
              <PublicRoute>
                <App />
              </PublicRoute>
            }>
              <Route index element={
                <PublicRoute>
                  <Home />
                </PublicRoute>
              } />
              <Route path="login-register" element={
                <PublicRoute>
                  <LoginRegister />
                </PublicRoute>
              } />
            </Route>

            {/* Debug Route - Always accessible */}
            <Route path="/debug-auth" element={<DebugAuth />} />

            {/* Shared Routes with Maintenance Check */}
            <Route path="/document-validator" element={
              <MaintenanceWrapper userRole="auto">
                <DocumentValidator />
              </MaintenanceWrapper>
            } />

            {/* TEST ROUTE - No protection but with maintenance check */}
            <Route path="/test-super-admin" element={
              <MaintenanceWrapper userRole="super_admin">
                <SuperAdminDashboard />
              </MaintenanceWrapper>
            } />

            {/* Dashboard Routes - PROTECTION + MAINTENANCE CHECK */}
            <Route path="/super-admin-dashboard" element={
              <ProtectedRoute>
                <MaintenanceWrapper userRole="super_admin">
                  <SuperAdminDashboard />
                </MaintenanceWrapper>
              </ProtectedRoute>
            } />

            <Route path="/admin-dashboard" element={
              <ProtectedRoute>
                <MaintenanceWrapper userRole="admin">
                  <AdminDashboard />
                </MaintenanceWrapper>
              </ProtectedRoute>
            } />

            <Route path="/support-dashboard" element={
              <ProtectedRoute>
                <MaintenanceWrapper userRole="support_agent">
                  <SupportAgentsDashboard />
                </MaintenanceWrapper>
              </ProtectedRoute>
            } />

            <Route path="/user-dashboard" element={
              <ProtectedRoute>
                <MaintenanceWrapper userRole="user">
                  <UserDashboard />
                </MaintenanceWrapper>
              </ProtectedRoute>
            } />
            
            {/* Error Routes - Always accessible */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Maintenance Test Route - Direct access to maintenance page */}
            <Route path="/maintenance-test" element={<MaintenancePage theme="light" />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SystemSettingsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default Router;