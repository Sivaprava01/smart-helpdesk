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
   * @param {Object} data - { customer_id, category_id, contact_name, contact_phone, location, description, preferred_time, is_scheduled, scheduled_for }
   */
  create: (data) => apiClient.post('/tickets', data),

  /**
   * Updates ticket details.
   * @param {string} id - Ticket UUID
   * @param {Object} data - { contact_name, contact_phone, location, description, category_id, preferred_time, is_scheduled, scheduled_for }
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
  getFeedbacks: (id) => apiClient.get(`/tickets/${id}/feedback-history`),
  getFeedbackHistory: (id) => apiClient.get(`/tickets/${id}/feedback-history`),

  /**
   * Submits customer verification response and rating for a completed ticket.
   * @param {string} id - Ticket UUID
   * @param {Object} data - { was_issue_resolved: boolean, rating?: number, comment?: string }
   * @param {string} [customerId] - Optional customer UUID for ownership verification
   */
  submitCustomerResponse: (id, data, customerId) => {
    const query = customerId ? `?customer_id=${encodeURIComponent(customerId)}` : '';
    const payload = {
      was_issue_resolved: data.was_issue_resolved !== undefined ? data.was_issue_resolved : data.is_resolved,
      rating: data.rating !== undefined ? data.rating : undefined,
      comment: data.comment || data.notes || undefined,
    };
    return apiClient.post(`/tickets/${id}/customer-response${query}`, payload);
  },

  /**
   * Records on-site technician arrival for an assigned ticket (moves ticket to ARRIVED).
   * @param {string} id - Ticket UUID
   * @param {string} [technicianId] - Optional technician UUID for verification
   */
  markArrived: (id, technicianId) => {
    const query = technicianId ? `?technician_id=${encodeURIComponent(technicianId)}` : '';
    return apiClient.post(`/tickets/${id}/arrive${query}`);
  },

  /**
   * Records technician initiating service work on-site (moves ticket to IN_PROGRESS).
   * @param {string} id - Ticket UUID
   * @param {string} [technicianId] - Optional technician UUID for verification
   */
  startWork: (id, technicianId) => {
    const query = technicianId ? `?technician_id=${encodeURIComponent(technicianId)}` : '';
    return apiClient.post(`/tickets/${id}/start-work${query}`);
  },

  /**
   * Records technician work completion (moves ticket to AWAITING_CUSTOMER_CONFIRMATION).
   * @param {string} id - Ticket UUID
   * @param {Object} [data] - { note?: string }
   * @param {string} [technicianId] - Optional technician UUID for verification
   */
  completeWork: (id, data = {}, technicianId) => {
    const query = technicianId ? `?technician_id=${encodeURIComponent(technicianId)}` : '';
    const payload = {
      note: data.note || data.completion_notes || undefined,
    };
    return apiClient.post(`/tickets/${id}/complete-work${query}`, payload);
  },
};
