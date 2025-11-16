import { Navigate, useLocation } from 'react-router-dom';
import { getUser } from '../utils/api';
import { isDemoMode, enableDemoMode } from '../utils/mockData';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const location = useLocation();
    
    // Auto-enable demo mode if accessing admin pages without authentication
    // This must happen synchronously before any redirect checks
    if (location.pathname.startsWith('/admin')) {
        const user = getUser();
        
        // If no user exists and we're on an admin route, enable demo mode
        if (!user || !user.role) {
            enableDemoMode();
        }
    }

    // Check if demo mode is enabled (temporary bypass for development)
    if (isDemoMode()) {
        const currentUser = getUser();
        // Ensure user is set up in demo mode (double-check)
        if (!currentUser || !currentUser.role) {
            enableDemoMode();
        }
        // In demo mode, always allow access to admin routes
        return children;
    }

    // Normal authentication check (when not in demo mode)
    const user = getUser();
    
    // If no user and not in demo mode, redirect to login
    if (!user || !user.role) {
        return <Navigate to="/login-register" replace />;
    }

    // Check role permissions
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Access Denied
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        You don't have permission to access this page.
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;

