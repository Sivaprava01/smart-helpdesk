import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { PersonaProvider } from './context/PersonaContext';
import AppLayout from './components/layout/AppLayout';
import TechnicianCapacityPage from './pages/technicians/TechnicianCapacityPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import CustomersPage from './pages/customers/CustomersPage';
import EmptyState from './components/common/EmptyState';

// Placeholder screen for pending phases
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
      <ToastProvider>
        <PersonaProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/technicians" replace />} />
              <Route path="technicians" element={<TechnicianCapacityPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="customers" element={<CustomersPage />} />
              
              {/* Placeholders for upcoming phases */}
              <Route
                path="dashboard"
                element={
                  <PhasePlaceholder
                    title="Operations Dashboard"
                    description="Real-time KPI metrics, active service queue, and team availability."
                    nextPhase="Phase 2"
                  />
                }
              />
              <Route
                path="tickets"
                element={
                  <PhasePlaceholder
                    title="Ticket Management Hub"
                    description="Searchable ticket data table with multi-factor filters and status tracking."
                    nextPhase="Phase 2"
                  />
                }
              />
              <Route
                path="technician/jobs"
                element={
                  <PhasePlaceholder
                    title="Technician Portal ('My Jobs')"
                    description="Active assignment offers with live countdown timers and field execution workflow."
                    nextPhase="Phase 4"
                  />
                }
              />
              <Route
                path="routing"
                element={
                  <PhasePlaceholder
                    title="Routing & Fallback Monitor"
                    description="Deterministic routing preview, scoring simulator, and expired offer timeout processing."
                    nextPhase="Phase 3"
                  />
                }
              />
              <Route path="*" element={<Navigate to="/technicians" replace />} />
            </Route>
          </Routes>
        </PersonaProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
