import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    default_location: '',
    age: '',
    password: '',
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Compute simple password strength (Weak, Fair, Strong)
  const passwordLength = formData.password.length;
  let strengthLabel = 'Too short';
  let strengthBars = 0;
  if (passwordLength >= 8) {
    strengthBars = 1;
    strengthLabel = 'Fair';
    if (/[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password)) {
      strengthBars = 2;
      strengthLabel = 'Good';
      if (/[^A-Za-z0-9]/.test(formData.password)) {
        strengthBars = 3;
        strengthLabel = 'Strong';
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!formData.phone_number.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service to register.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        default_location: formData.default_location.trim() || 'Tower A, Apt 101',
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        password: formData.password,
      });

      navigate('/technicians', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen d-flex flex-column justify-content-center align-items-center py-5 px-3" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <div className="w-100" style={{ maxWidth: '480px' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-2 bg-primary text-white mb-2"
            style={{ width: '40px', height: '40px' }}
          >
            <span className="material-symbols-outlined fill-1" style={{ fontSize: '24px' }}>
              widgets
            </span>
          </div>
          <h1 className="font-headline h4 text-on-surface fw-bold mb-1">Resident Registration</h1>
          <p className="text-secondary small mb-0">Create your Smart-HelpDesk account to submit and track maintenance requests</p>
        </div>

        {/* Form Card */}
        <div className="sh-card bg-white p-4 p-md-4 shadow-sm border border-outline-variant">
          {error && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3" role="alert">
              <span className="material-symbols-outlined text-danger" style={{ fontSize: '18px' }}>
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label font-label text-secondary mb-1" htmlFor="regName">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                id="regName"
                type="text"
                className="form-control"
                placeholder="e.g. Siva Prava"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label font-label text-secondary mb-1" htmlFor="regEmail">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                id="regEmail"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-7">
                <label className="form-label font-label text-secondary mb-1" htmlFor="regPhone">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  id="regPhone"
                  type="text"
                  className="form-control"
                  placeholder="+919876543210"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                />
              </div>
              <div className="col-5">
                <label className="form-label font-label text-secondary mb-1" htmlFor="regAge">
                  Age (Optional)
                </label>
                <input
                  id="regAge"
                  type="number"
                  min="18"
                  max="120"
                  className="form-control"
                  placeholder="e.g. 28"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label font-label text-secondary mb-1" htmlFor="regLocation">
                Unit / Apartment Number
              </label>
              <input
                id="regLocation"
                type="text"
                className="form-control"
                placeholder="e.g. Tower A, Apt 402"
                value={formData.default_location}
                onChange={(e) => setFormData({ ...formData, default_location: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label font-label text-secondary mb-1" htmlFor="regPassword">
                Password (min 8 characters) <span className="text-danger">*</span>
              </label>
              <input
                id="regPassword"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              {/* Password Strength Indicator (Matches Stitch 6560439f...) */}
              <div className="d-flex align-items-center gap-2 mt-2">
                <div className="progress flex-grow-1" style={{ height: '4px' }}>
                  <div
                    className={`progress-bar ${
                      strengthBars === 1 ? 'bg-warning' : strengthBars >= 2 ? 'bg-success' : 'bg-secondary'
                    }`}
                    style={{ width: `${(strengthBars / 3) * 100}%` }}
                  ></div>
                </div>
                <span className="font-label text-secondary" style={{ fontSize: '10px' }}>
                  {formData.password ? strengthLabel : 'Required'}
                </span>
              </div>
            </div>

            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <label className="form-check-label text-secondary small" htmlFor="agreeTerms">
                I agree to the facility Terms of Service and Privacy Policy.
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2 justify-content-center"
              loading={loading}
            >
              Create Resident Account
            </Button>
          </form>

          <div className="text-center pt-3 border-top border-outline-variant mt-3">
            <p className="text-secondary small mb-0">
              Already registered?{' '}
              <Link to="/login" className="fw-bold text-primary text-decoration-none">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
