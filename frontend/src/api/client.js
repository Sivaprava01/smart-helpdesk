/**
 * Core API Client for Smart-HelpDesk Backend
 * Connects directly to FastAPI backend via /api/v1 prefix
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
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
