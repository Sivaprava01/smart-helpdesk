import { apiClient } from './client';

export const authApi = {
  /**
   * Registers a new resident/customer account.
   * @param {Object} data - { email, password, full_name, phone_number, default_location, age }
   */
  register: (data) => apiClient.post('/auth/register', data),

  /**
   * Authenticates user credentials with email and password.
   * @param {Object} credentials - { email, password }
   */
  login: (credentials) => apiClient.post('/auth/login', credentials),

  /**
   * Refreshes access token using a valid refresh token.
   * @param {string} refreshToken
   */
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refresh_token: refreshToken }),

  /**
   * Fetches current authenticated user profile.
   */
  getMe: () => apiClient.get('/auth/me'),

  /**
   * Logs out current user session.
   */
  logout: () => apiClient.post('/auth/logout'),

  /**
   * Retrieves the Google OAuth consent authorization URL.
   */
  getGoogleAuthUrl: () => apiClient.get('/auth/oauth/google/url'),

  /**
   * Exchanges Google OAuth authorization code or credential token for JWT session.
   * @param {Object} data - { code, credential, redirect_uri }
   */
  googleCallback: (data) => apiClient.post('/auth/oauth/google/callback', data),
};
