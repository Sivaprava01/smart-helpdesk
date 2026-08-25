import { apiClient } from './client';

export const categoriesApi = {
  list: (params = {}) => apiClient.get('/categories', params),
  getById: (id) => apiClient.get(`/categories/${id}`),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.patch(`/categories/${id}`, data),
};
