import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = null, children = null }) {
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
      return (
        <div className="container py-5 text-center" style={{ maxWidth: '520px' }}>
          <div className="sh-card bg-white p-5 shadow-sm border border-danger-subtle">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger mb-3"
              style={{ width: '56px', height: '56px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                lock
              </span>
            </div>
            <h2 className="font-headline h5 text-danger mb-2">Access Restricted</h2>
            <p className="text-secondary small mb-4">
              Your account role (<strong>{userRole}</strong>) does not have permission to view this section.
            </p>
            <button
              type="button"
              className="btn-sh-secondary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children ? children : <Outlet />;
}
