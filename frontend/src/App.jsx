import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Pages
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';

// Authenticated Phase 2 Pages (Dashboard & Tickets)
import DashboardPage from './pages/dashboard/DashboardPage';
import TicketListPage from './pages/tickets/TicketListPage';
import CreateTicketPage from './pages/tickets/CreateTicketPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';

// Authenticated Phase 1 Pages (Entities & Capacities)
import TechnicianCapacityPage from './pages/technicians/TechnicianCapacityPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import CustomersPage from './pages/customers/CustomersPage';

// Placeholder for upcoming phases
import EmptyState from './components/common/EmptyState';

function PhasePlaceholder({ title, description, nextPhase }) {
  return (
    <div className="py-4">
      <div className="sh-card bg-white p-4">
        <h2 className="h4 font-headline text-on-surface mb-2">{title}</h2>
        <p className="text-secondary mb-4">{description}</p>
        <EmptyState
          icon="construction"
          title={`Scheduled for ${nextPhase}`}
          description="This workflow is scheduled in the phased implementation plan and will be connected to live backend APIs in the upcoming phase."
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                {/* Phase 2: Operations Dashboard & Ticket Lifecycle */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tickets" element={<TicketListPage />} />
                <Route path="/tickets/new" element={<CreateTicketPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />

                {/* Phase 1: Admin & Dispatcher Master Entities */}
                <Route
                  path="/technicians"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
                      <TechnicianCapacityPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/categories"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
                      <CategoriesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
                      <CustomersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Upcoming Phases */}
                <Route
                  path="/technician/jobs"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER', 'TECHNICIAN']}>
                      <PhasePlaceholder
                        title="Technician Field Portal ('My Jobs')"
                        description="Active assignment offers with live countdown timers and field execution workflow."
                        nextPhase="Phase 4"
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/routing"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
                      <PhasePlaceholder
                        title="Routing & Fallback Monitor"
                        description="Deterministic routing preview, scoring simulator, and expired offer timeout processing."
                        nextPhase="Phase 3"
                      />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
