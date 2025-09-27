// src/Router.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import DocumentValidator from "./pages/DocumentValidator.jsx";
import LoginRegister from "./pages/LoginRegister.jsx";
import AdminDashboard from './pages/AdminDashboard.jsx';
import Home from "./pages/Home.jsx";
import { ThemeProvider } from "./contexts/ThemeContext"; // ADD THIS IMPORT

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
    <ThemeProvider>  {/* Wrap ALL routes */}
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="/login-register" element={<LoginRegister />} />
        </Route>

        <Route path="/document-validator" element={<DocumentValidator />} />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
      </Routes>
    </ThemeProvider>
  );
}

export default Router;