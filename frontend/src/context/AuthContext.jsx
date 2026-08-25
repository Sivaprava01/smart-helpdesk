import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session by verifying token with /auth/me on app launch
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          setToken(storedToken);
        } catch (err) {
          console.warn('Session verification failed on startup:', err.message);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }

    initAuth();

    // Listen for global auth expiration events from API interceptor
    function handleAuthExpired() {
      setUser(null);
      setToken(null);
    }

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
    if (res.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, res.refresh_token);
    }
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (formData) => {
    // 1. Create account
    const registeredUser = await authApi.register(formData);
    // 2. Automatically authenticate with credentials
    if (formData.password) {
      try {
        const loginRes = await authApi.login({
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem(TOKEN_STORAGE_KEY, loginRes.access_token);
        if (loginRes.refresh_token) {
          localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, loginRes.refresh_token);
        }
        setToken(loginRes.access_token);
        setUser(loginRes.user);
        return loginRes.user;
      } catch {
        // Return registered user if auto-login fails
        return registeredUser;
      }
    }
    return registeredUser;
  }, []);

  const loginWithOAuth = useCallback(async ({ code, credential, redirectUri }) => {
    const res = await authApi.googleCallback({
      code,
      credential,
      redirect_uri: redirectUri,
    });
    localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
    if (res.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, res.refresh_token);
    }
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (err) {
      console.warn('Logout API request error (continuing local cleanup):', err);
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      setUser(null);
      setToken(null);
    }
  }, [token]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    loginWithOAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
