import { apiClient } from './client';

export const techniciansApi = {
  list: (params = {}) => apiClient.get('/technicians', params),
  getById: (id) => apiClient.get(`/technicians/${id}`),
  create: (data) => apiClient.post('/technicians', data),
  update: (id, data) => apiClient.patch(`/technicians/${id}`, data),
};
