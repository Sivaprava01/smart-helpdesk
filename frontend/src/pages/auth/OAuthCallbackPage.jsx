import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from '../../components/common/SkeletonLoader';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithOAuth } = useAuth();

  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    async function handleCallback() {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Google OAuth authorization was cancelled or denied: ${errorParam}`);
        setProcessing(false);
        return;
      }

      if (!code) {
        setError('No authorization code received from Google.');
        setProcessing(false);
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const user = await loginWithOAuth({ code, redirectUri });
        const target = user?.role === 'TECHNICIAN' ? '/technician/jobs' : (user?.role === 'ADMIN' || user?.role === 'DISPATCHER' ? '/dashboard' : '/tickets');
        navigate(target, { replace: true });
      } catch (err) {
        setError(err.message || 'Failed to complete Google OAuth authentication with server.');
        setProcessing(false);
      }
    }

    handleCallback();
  }, [location, loginWithOAuth, navigate]);

  return (
    <div className="min-h-screen d-flex flex-column justify-content-center align-items-center py-5 px-3" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <div className="sh-card bg-white p-5 text-center shadow-sm" style={{ maxWidth: '420px', width: '100%' }}>
        {processing ? (
          <div>
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '48px', height: '48px' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h2 className="font-headline h5 text-on-surface mb-2">Verifying Google Credentials</h2>
            <p className="text-secondary small mb-0">Completing secure authentication and setting up your session...</p>
          </div>
        ) : (
          <div>
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger mb-3"
              style={{ width: '56px', height: '56px' }}
            >
              <span className="material-symbols-outlined text-danger" style={{ fontSize: '32px' }}>
                error
              </span>
            </div>
            <h2 className="font-headline h5 text-danger mb-2">Authentication Failed</h2>
            <p className="text-secondary small mb-4">{error}</p>
            <Link to="/login" className="btn-sh-primary text-decoration-none w-100 justify-content-center">
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
