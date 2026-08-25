import { apiClient } from './client';

export const customersApi = {
  list: (params = {}) => apiClient.get('/customers', params),
  getById: (id) => apiClient.get(`/customers/${id}`),
  create: (data) => apiClient.post('/customers', data),
  update: (id, data) => apiClient.patch(`/customers/${id}`, data),
};
