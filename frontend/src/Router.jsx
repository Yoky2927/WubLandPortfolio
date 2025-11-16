// src/Router.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx"; // Layout component
import DocumentValidator from "./pages/DocumentValidator.jsx";
import LoginRegister from "./pages/LoginRegister.jsx";
import Home from "./pages/Home.jsx"; // Import Home component
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Reports from "./pages/admin/Reports.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
    return (
        <Routes>
            <Route path="/" element={<App />}>
                <Route index element={<Home />} /> {/* Home as the default route */}
            </Route>
            <Route path="/document-validator" element={<DocumentValidator />} />
            <Route path="/login-register" element={<LoginRegister />} />
            
            {/* Admin Routes - Protected */}
            <Route 
                path="/admin/dashboard" 
                element={
                    <ProtectedRoute allowedRoles={['admin', 'broker']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin/reports" 
                element={
                    <ProtectedRoute allowedRoles={['admin', 'broker']}>
                        <Reports />
                    </ProtectedRoute>
                } 
            />
            
            {/* Redirect /admin to dashboard */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
    );
}

export default Router;