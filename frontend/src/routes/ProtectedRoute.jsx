import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import LoadingState from '../components/feedback/LoadingState';

/**
 * Route guard component for authenticated and role-restricted routes
 * @param {string[]} allowedRoles - List of permitted roles
 */
export function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullPage message="Đang kiểm tra quyền truy cập..." />;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
