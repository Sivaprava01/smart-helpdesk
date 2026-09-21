import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function getRoleDefaultRoute(role) {
  if (role === 'ADMIN' || role === 'DISPATCHER') return '/dashboard';
  if (role === 'TECHNICIAN') return '/technician/jobs';
  if (role === 'CUSTOMER') return '/tickets';
  return '/';
}

export default function ProtectedRoute({
  allowedRoles = null,
  redirectTo = null,
  children = null,
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '40px', height: '40px' }}>
          <span className="visually-hidden">Loading session...</span>
        </div>
        <div className="font-headline text-secondary small">Verifying authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = user?.role;
    // Admins always have access
    const isAllowed = userRole === 'ADMIN' || allowedRoles.includes(userRole);

    if (!isAllowed) {
      const destination = redirectTo || getRoleDefaultRoute(userRole);
      return <Navigate to={destination} replace />;
    }
  }

  return children ? children : <Outlet />;
}
