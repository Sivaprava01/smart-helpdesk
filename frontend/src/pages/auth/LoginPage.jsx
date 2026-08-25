import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePreset, setActivePreset] = useState(null);

  // Quick preset helper for development and demo testing
  const presets = [
    { label: 'Admin', email: 'admin@smarthelpdesk.com', pass: 'AdminPass123!', role: 'ADMIN', icon: 'shield_person' },
    { label: 'Dispatcher', email: 'dispatcher@smarthelpdesk.com', pass: 'DispatchPass123!', role: 'DISPATCHER', icon: 'headset_mic' },
    { label: 'Technician', email: 'tech.ravi@smarthelpdesk.com', pass: 'TechPass123!', role: 'TECHNICIAN', icon: 'engineering' },
    { label: 'Resident', email: 'resident.alice@smarthelpdesk.com', pass: 'ResidentPass123!', role: 'CUSTOMER', icon: 'home' },
  ];

  function handleSelectPreset(preset) {
    setEmail(preset.email);
    setPassword(preset.pass);
    setActivePreset(preset.role);
    setError(null);
  }

  function getRoleDefaultRoute(role) {
    if (role === 'ADMIN' || role === 'DISPATCHER') return '/dashboard';
    if (role === 'TECHNICIAN') return '/technician/jobs';
    return '/tickets';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await login(email.trim(), password);

      // Determine appropriate redirect destination
      const fromPath = location.state?.from?.pathname;
      const defaultPath = getRoleDefaultRoute(user?.role);
      const targetPath = fromPath && fromPath !== '/login' ? fromPath : defaultPath;

      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleOAuth() {
    try {
      setOauthLoading(true);
      setError(null);
      const res = await authApi.getGoogleAuthUrl();
      if (res && res.authorization_url) {
        window.location.href = res.authorization_url;
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize Google OAuth flow.');
      setOauthLoading(false);
    }
  }

  return (
    <div className="min-h-screen d-flex" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* Left Split Hero Section (Matches Stitch 0307e6bc...) */}
      <div
        className="d-none d-lg-flex col-lg-6 flex-column justify-content-between p-5 text-white position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #3525cd 0%, #4f46e5 50%, #571ac0 100%)',
        }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-5">
            <span className="material-symbols-outlined fill-1" style={{ fontSize: '32px' }}>
              widgets
            </span>
            <span className="font-display h3 mb-0 text-white fw-bold">Smart-HelpDesk</span>
          </div>

          <div style={{ maxWidth: '480px' }} className="mt-4">
            <h1 className="font-headline display-6 fw-bold mb-3 text-white">Live Ops Command Center</h1>
            <p className="lead text-white-50 mb-4" style={{ fontSize: '16px', lineHeight: '1.6' }}>
              Streamline facility management, dispatch technicians with multi-factor ranking, and maintain operational excellence with real-time tracking.
            </p>

            <div className="vstack gap-3 mt-4">
              <div className="d-flex align-items-start gap-3">
                <div
                  className="p-2 rounded-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                >
                  <span className="material-symbols-outlined text-white">rocket_launch</span>
                </div>
                <div>
                  <div className="fw-semibold text-white">Rapid Dispatch</div>
                  <div className="text-white-50 small">Deterministic routing scores top technicians in milliseconds.</div>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div
                  className="p-2 rounded-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                >
                  <span className="material-symbols-outlined text-white">security</span>
                </div>
                <div>
                  <div className="fw-semibold text-white">Role-Based Access</div>
                  <div className="text-white-50 small">Strict boundaries for Admins, Dispatchers, Technicians, and Residents.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center font-label text-white-50 pt-4 border-top border-white-25" style={{ fontSize: '11px' }}>
          <span>© Smart-HelpDesk Systems</span>
          <span>System Status: Operational</span>
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="col-12 col-lg-6 d-flex flex-column justify-content-center align-items-center p-4 p-md-5">
        <div className="w-100" style={{ maxWidth: '440px' }}>
          {/* Brand header on mobile */}
          <div className="d-flex d-lg-none align-items-center gap-2 mb-4 justify-content-center">
            <span className="material-symbols-outlined text-primary fill-1" style={{ fontSize: '28px' }}>
              widgets
            </span>
            <span className="font-display h4 mb-0 text-on-surface fw-bold">Smart-HelpDesk</span>
          </div>

          <div className="text-center mb-3">
            <h2 className="font-headline h4 text-on-surface fw-bold mb-1">Welcome Back</h2>
            <p className="text-secondary small mb-0">Sign in to your operational workspace</p>
          </div>

          {/* Role Fast-Switcher Demo Tabs (Dev Mode Only - Automatically omitted in Production) */}
          {import.meta.env.DEV && (
            <div className="p-1 bg-surface-container-low rounded-3 border border-outline-variant mb-4">
              <div className="text-center font-label text-secondary py-1" style={{ fontSize: '10px' }}>
                DEMO FAST-SWITCHER (CLICK TO AUTO-FILL CREDENTIALS)
              </div>
              <div className="row g-1">
                {presets.map((preset) => {
                  const isSelected = activePreset === preset.role || email === preset.email;
                  return (
                    <div key={preset.role} className="col-6 col-sm-3">
                      <button
                        type="button"
                        className={`btn btn-sm w-100 py-1 px-1 text-center font-label d-flex flex-column align-items-center justify-content-center ${
                          isSelected
                            ? 'bg-primary text-white fw-bold shadow-sm'
                            : 'btn-link text-secondary text-decoration-none hover-bg'
                        }`}
                        style={{ fontSize: '10px', borderRadius: 'var(--radius-md)' }}
                        onClick={() => handleSelectPreset(preset)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {preset.icon}
                        </span>
                        <span>{preset.label}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3" role="alert">
              <span className="material-symbols-outlined text-danger" style={{ fontSize: '18px' }}>
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label font-label text-secondary mb-1" htmlFor="loginEmail">
                Email Address <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <span
                  className="material-symbols-outlined position-absolute text-secondary"
                  style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}
                >
                  mail
                </span>
                <input
                  id="loginEmail"
                  type="email"
                  className="form-control ps-5"
                  placeholder="name@smarthelpdesk.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setActivePreset(null);
                  }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label font-label text-secondary mb-0" htmlFor="loginPassword">
                  Password <span className="text-danger">*</span>
                </label>
              </div>
              <div className="position-relative">
                <span
                  className="material-symbols-outlined position-absolute text-secondary"
                  style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}
                >
                  lock
                </span>
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control ps-5 pe-5"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActivePreset(null);
                  }}
                  required
                />
                <button
                  type="button"
                  className="btn btn-sm btn-link position-absolute text-secondary p-0"
                  style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2 justify-content-center mt-2"
              loading={loading}
            >
              <span>Sign In</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                arrow_forward
              </span>
            </Button>
          </form>

          {/* OAuth Divider */}
          <div className="position-relative my-4 text-center">
            <hr className="border-outline-variant my-0" />
            <span
              className="position-absolute top-50 start-50 translate-middle px-3 bg-white text-secondary font-label"
              style={{ fontSize: '10px' }}
            >
              OR CONTINUE WITH
            </span>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 py-2 mb-3 bg-white"
            onClick={handleGoogleOAuth}
            disabled={oauthLoading || loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="fw-semibold text-on-surface" style={{ fontSize: '13px' }}>
              {oauthLoading ? 'Redirecting to Google...' : 'Sign in with Google'}
            </span>
          </button>

          {/* Registration link */}
          <div className="text-center pt-2">
            <p className="text-secondary small mb-0">
              New resident?{' '}
              <Link to="/register" className="fw-bold text-primary text-decoration-none">
                Register Resident Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
