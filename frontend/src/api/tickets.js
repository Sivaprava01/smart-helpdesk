import { apiClient } from './client';

export const ticketsApi = {
  /**
   * Lists tickets with optional filtering.
   * @param {Object} params - { customer_id, category_id, status, is_urgent, skip, limit }
   */
  list: (params = {}) => apiClient.get('/tickets', params),

  /**
   * Retrieves ticket details by ID.
   * @param {string} id - Ticket UUID
   */
  getById: (id) => apiClient.get(`/tickets/${id}`),

  /**
   * Creates a new service ticket.
   * @param {Object} data - { customer_id, service_category_id, title, description, is_urgent, scheduled_for }
   */
  create: (data) => apiClient.post('/tickets', data),

  /**
   * Updates ticket details.
   * @param {string} id - Ticket UUID
   * @param {Object} data - { title, description, is_urgent, scheduled_for }
   */
  update: (id, data) => apiClient.patch(`/tickets/${id}`, data),

  /**
   * Cancels a pending ticket.
   * @param {string} id - Ticket UUID
   */
  cancel: (id) => apiClient.post(`/tickets/${id}/cancel`),

  /**
   * Retrieves ticket status summary.
   * @param {string} id - Ticket UUID
   */
  getStatus: (id) => apiClient.get(`/tickets/${id}/status`),

  /**
   * Retrieves all customer feedback records for a ticket.
   * @param {string} id - Ticket UUID
   */
  getFeedbacks: (id) => apiClient.get(`/tickets/${id}/feedbacks`),

  /**
   * Submits customer verification response and rating for a completed ticket.
   * @param {string} id - Ticket UUID
   * @param {Object} data - { is_resolved: boolean, rating?: number, notes?: string }
   */
  submitCustomerResponse: (id, data) => apiClient.post(`/tickets/${id}/customer-response`, data),
};
