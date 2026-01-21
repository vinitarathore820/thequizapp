// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute component that renders children only if user is authenticated
 * If not authenticated, redirects to login page with the current location
 */
const ProtectedRoute = ({ children, ...rest }) => {
  const location = useLocation();

  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login page with the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the child routes
  return children || <Outlet />;
};

export default ProtectedRoute;