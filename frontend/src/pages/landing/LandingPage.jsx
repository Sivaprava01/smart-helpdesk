import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function LandingPage() {
  const workflowSteps = [
    {
      step: '01',
      icon: 'receipt_long',
      title: 'Structured Service Request',
      description: 'Residents submit maintenance tickets with facility category selection, ASAP or scheduled timing, and unit location.',
    },
    {
      step: '02',
      icon: 'psychology',
      title: 'Intelligent Candidate Scoring',
      description: 'The dispatch engine computes multi-factor scores considering location proximity, rating, customer history, and live workload capacity.',
    },
    {
      step: '03',
      icon: 'assignment_turned_in',
      title: 'Technician Assignment Offer',
      description: 'Job offers are routed to the top-ranked specialist with 15-minute response windows, with automated fallback rerouting if declined or expired.',
    },
    {
      step: '04',
      icon: 'engineering',
      title: 'Field Service Execution',
      description: 'Specialists log on-site arrival, start active maintenance work, and record job completion notes directly in the portal.',
    },
    {
      step: '05',
      icon: 'verified',
      title: 'Customer-Confirmed Resolution',
      description: 'Two-click resident confirmation ensures quality. Unresolved issues automatically reopen for alternative specialist dispatch.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface d-flex flex-column" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Top Navbar */}
      <header className="border-bottom border-outline-variant bg-white py-3 px-4 px-md-5">
        <div className="container-fluid d-flex justify-content-between align-items-center max-w-7xl mx-auto p-0">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-2 bg-primary text-white"
              style={{ width: '36px', height: '36px' }}
            >
              <span className="material-symbols-outlined fill-1" style={{ fontSize: '20px' }}>
                widgets
              </span>
            </div>
            <div>
              <span className="font-headline text-on-surface fw-bold h5 mb-0 d-block" style={{ lineHeight: '1.1' }}>
                Smart-HelpDesk
              </span>
              <span className="font-label text-secondary" style={{ fontSize: '10px' }}>
                Facility Operations & Dispatch
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <Link to="/login" className="btn btn-sm btn-link text-on-surface text-decoration-none fw-semibold">
              Sign In
            </Link>
            <Link to="/register" className="btn-sh-primary btn-sm text-decoration-none">
              Register Resident
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-5 px-3 px-md-4 border-bottom border-outline-variant bg-white">
        <div className="container py-4" style={{ maxWidth: '1000px' }}>
          <div className="row align-items-center gy-4">
            <div className="col-12 col-lg-7">
              <div className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill bg-surface-container border border-outline-variant text-primary font-label mb-3" style={{ fontSize: '11px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                Intelligent Dispatch & Resolution Engine
              </div>
              <h1 className="font-display text-on-surface display-5 fw-bold mb-3" style={{ letterSpacing: '-0.02em', lineHeight: '1.15' }}>
                Precision Maintenance Operations for Residential Facilities
              </h1>
              <p className="text-secondary font-body lead mb-4" style={{ fontSize: '16px', lineHeight: '1.6' }}>
                Automated ticket intake, deterministic specialist ranking, live field execution tracking, and customer-verified resolution workflows.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/login" className="btn-sh-primary text-decoration-none px-4 py-2">
                  <span className="material-symbols-outlined">login</span>
                  <span>Enter Operations Portal</span>
                </Link>
                <Link to="/register" className="btn-sh-secondary text-decoration-none px-4 py-2">
                  <span>Register Resident Account</span>
                </Link>
              </div>
            </div>

            {/* Visual Operational Snapshot */}
            <div className="col-12 col-lg-5">
              <div className="sh-card bg-surface-container-low border border-outline-variant p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="font-label text-secondary" style={{ fontSize: '11px' }}>OPERATIONAL ARCHITECTURE</span>
                  <span className="sh-badge sh-badge-closed">Active System</span>
                </div>
                <div className="vstack gap-2">
                  <div className="p-2 bg-white rounded border border-outline-variant d-flex align-items-center gap-3">
                    <span className="material-symbols-outlined text-primary">speed</span>
                    <div>
                      <div className="font-headline fw-semibold small text-on-surface">Deterministic Routing</div>
                      <div className="text-secondary small" style={{ fontSize: '11px' }}>5-factor weighted algorithm</div>
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border border-outline-variant d-flex align-items-center gap-3">
                    <span className="material-symbols-outlined text-primary">timer</span>
                    <div>
                      <div className="font-headline fw-semibold small text-on-surface">15-Min Response Windows</div>
                      <div className="text-secondary small" style={{ fontSize: '11px' }}>Automated timeout & fallback</div>
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border border-outline-variant d-flex align-items-center gap-3">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    <div>
                      <div className="font-headline fw-semibold small text-on-surface">Customer Verification</div>
                      <div className="text-secondary small" style={{ fontSize: '11px' }}>Direct confirmation & star ratings</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle Workflow Section */}
      <section className="py-5 px-3 px-md-4 flex-grow-1">
        <div className="container" style={{ maxWidth: '1100px' }}>
          <div className="text-center mb-5">
            <h2 className="font-display h3 text-on-surface mb-2">End-to-End Service Lifecycle</h2>
            <p className="text-secondary mx-auto" style={{ maxWidth: '600px', fontSize: '14px' }}>
              How Smart-HelpDesk coordinates resident requests, dispatch algorithms, and field technicians seamlessly.
            </p>
          </div>

          <div className="row g-3 justify-content-center">
            {workflowSteps.map((step) => (
              <div key={step.step} className="col-12 col-md-6 col-lg-4">
                <div className="sh-card h-100 p-4 bg-white border border-outline-variant d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {step.icon}
                      </span>
                    </div>
                    <span className="font-mono text-secondary fw-semibold small">{step.step}</span>
                  </div>
                  <h3 className="font-headline h6 text-on-surface mb-2">{step.title}</h3>
                  <p className="text-secondary small mb-0" style={{ lineHeight: '1.5' }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Portal Access Bar */}
          <div className="mt-5 p-4 rounded-3 border border-outline-variant bg-white d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div>
              <div className="font-headline fw-bold text-on-surface h6 mb-1">Ready to access your workspace?</div>
              <div className="text-secondary small">Sign in using your assigned credentials or Google OAuth account.</div>
            </div>
            <div className="d-flex gap-2">
              <Link to="/login" className="btn-sh-primary text-decoration-none">
                Sign In Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-top border-outline-variant py-3 px-4 bg-white text-center text-secondary small font-label">
        Smart-HelpDesk Operations Platform • Secure JWT & OAuth Authentication
      </footer>
    </div>
  );
}
