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

// Authenticated Operations Pages (Phase 2 & Phase 3)
import DashboardPage from './pages/dashboard/DashboardPage';
import TicketListPage from './pages/tickets/TicketListPage';
import CreateTicketPage from './pages/tickets/CreateTicketPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import RoutingMonitorPage from './pages/routing/RoutingMonitorPage';

// Authenticated Specialist Pages (Phase 4)
import TechnicianPortalPage from './pages/technician/TechnicianPortalPage';

// Authenticated Operations Pages (Phase 1)
import TechnicianCapacityPage from './pages/technicians/TechnicianCapacityPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import CustomersPage from './pages/customers/CustomersPage';

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
                {/* Operations & Dispatch Dashboard (Admin & Dispatcher) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Ticket Lifecycle (All Authenticated Roles) */}
                <Route path="/tickets" element={<TicketListPage />} />
                <Route path="/tickets/new" element={<CreateTicketPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />

                {/* Phase 3: Routing Engine & Fallback Monitor (Admin & Dispatcher) */}
                <Route
                  path="/routing"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
                      <RoutingMonitorPage />
                    </ProtectedRoute>
                  }
                />

                {/* Phase 4: Technician Field Portal ('My Jobs') */}
                <Route
                  path="/technician/jobs"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCHER', 'TECHNICIAN']}>
                      <TechnicianPortalPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin & Dispatcher Master Entities */}
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
