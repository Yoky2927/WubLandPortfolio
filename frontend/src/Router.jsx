// src/Router.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import DocumentValidator from "./pages/DocumentValidator.jsx";
import LoginRegister from "./pages/LoginRegister.jsx";
import AdminDashboard from './pages/AdminDashboard.jsx';
import SupportAgentsDashboard from './pages/SupportAgentsDashboard.jsx'; // ADD THIS IMPORT
import Home from "./pages/Home.jsx";
import { ThemeProvider } from "./contexts/ThemeContext";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login-register" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function Router() {
   return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="/login-register" element={<LoginRegister />} />
        </Route>

        <Route path="/document-validator" element={<DocumentValidator />} />
        
        {/* Admin Dashboard Route */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Support Agent Dashboard Route */}
        <Route path="/support-dashboard" element={
          <ProtectedRoute requiredRole="support_agent">
            <SupportAgentsDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default Router;