/**
 * Core API Client for Smart-HelpDesk Backend
 * Connects directly to FastAPI backend via /api/v1 prefix with JWT Bearer auth and refresh interceptor
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const TOKEN_STORAGE_KEY = 'smart_helpdesk_access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'smart_helpdesk_refresh_token';

class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function request(endpoint, options = {}, isRetry = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Handle empty 204 No Content responses
    if (response.status === 204) {
      return null;
    }

    // Handle 401 Unauthorized with token refresh if not already retried or calling auth endpoints
    if (
      response.status === 401 &&
      !isRetry &&
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/register') &&
      !endpoint.startsWith('/auth/refresh')
    ) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              localStorage.setItem(TOKEN_STORAGE_KEY, refreshData.access_token);
              if (refreshData.refresh_token) {
                localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshData.refresh_token);
              }
              isRefreshing = false;
              onRefreshed(refreshData.access_token);
              // Retry original request
              return request(endpoint, options, true);
            } else {
              // Refresh token invalid or expired
              isRefreshing = false;
              localStorage.removeItem(TOKEN_STORAGE_KEY);
              localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
              window.dispatchEvent(new CustomEvent('auth:expired'));
            }
          } catch {
            isRefreshing = false;
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
            window.dispatchEvent(new CustomEvent('auth:expired'));
          }
        } else {
          // Wait for active refresh to complete
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              if (newToken) {
                resolve(request(endpoint, options, true));
              } else {
                reject(new ApiError('Session expired. Please log in again.', 401));
              }
            });
          });
        }
      }
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred while communicating with the server.';

      if (data && typeof data === 'object') {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Pydantic validation error array
          errorMessage = data.detail.map((err) => `${err.loc?.join('.')} ${err.msg}`).join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        }
      }

      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or parse error
    throw new ApiError(
      'Unable to connect to the Smart-HelpDesk server. Please check your network connection.',
      0,
      error
    );
  }
}

export const apiClient = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return request(queryString ? `${endpoint}?${queryString}` : endpoint, { method: 'GET' });
  },

  post: (endpoint, body = {}) => {
    return request(endpoint, { method: 'POST', body });
  },

  patch: (endpoint, body = {}) => {
    return request(endpoint, { method: 'PATCH', body });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  },
};
