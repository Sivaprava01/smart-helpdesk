import { apiClient } from './client';

export const assignmentsApi = {
  /**
   * Dispatches initial assignment offer for a ticket to the top-ranked technician.
   * @param {string} ticketId - Ticket UUID
   */
  startAssignment: (ticketId) => apiClient.post(`/tickets/${ticketId}/assign`),

  /**
   * Retrieves full history of assignment attempts and outcomes for a ticket.
   * @param {string} ticketId - Ticket UUID
   */
  listByTicket: (ticketId) => apiClient.get(`/tickets/${ticketId}/assignments`),

  /**
   * Retrieves currently active assignment offer for a ticket.
   * @param {string} ticketId - Ticket UUID
   */
  getActiveForTicket: async (ticketId) => {
    const list = await apiClient.get(`/tickets/${ticketId}/assignments`);
    if (Array.isArray(list)) {
      return list.find((a) => a.status === 'OFFERED' || a.status === 'DEFERRED') || null;
    }
    return null;
  },

  /**
   * Accepts an active assignment offer and moves ticket to ASSIGNED (+1 workload).
   * @param {string} assignmentId - Assignment UUID
   * @param {string} [technicianId] - Optional technician UUID for verification
   */
  accept: (assignmentId, technicianId) => {
    const query = technicianId ? `?technician_id=${encodeURIComponent(technicianId)}` : '';
    return apiClient.post(`/assignments/${assignmentId}/accept${query}`);
  },

  /**
   * Compatibility alias for accept
   */
  acceptAssignment(assignmentId, technicianId) {
    return this.accept(assignmentId, technicianId);
  },

  /**
   * Declines an assignment offer and triggers automated fallback rerouting.
   * @param {string} assignmentId - Assignment UUID
   * @param {Object} [data] - { reason?: string, note?: string }
   * @param {string} [technicianId] - Optional technician UUID for verification
   */
  decline: (assignmentId, data = {}, technicianId) => {
    const query = technicianId ? `?technician_id=${encodeURIComponent(technicianId)}` : '';
    return apiClient.post(`/assignments/${assignmentId}/decline${query}`, data);
  },

  /**
   * Compatibility alias for decline
   */
  declineAssignment(assignmentId, data, technicianId) {
    return this.decline(assignmentId, data, technicianId);
  },

  /**
   * Defers an assignment offer ("Ask Me Later" preserving original deadline).
   * @param {string} assignmentId - Assignment UUID
   * @param {string} [technicianId] - Optional technician UUID for verification
   */
  defer: (assignmentId, technicianId) => {
    const query = technicianId ? `?technician_id=${encodeURIComponent(technicianId)}` : '';
    return apiClient.post(`/assignments/${assignmentId}/ask-later${query}`);
  },

  /**
   * Compatibility alias for defer
   */
  deferAssignment(assignmentId, technicianId) {
    return this.defer(assignmentId, technicianId);
  },

  /**
   * Triggers batch scanner to expire timed-out offers and trigger fallback rerouting.
   */
  processExpired: () => apiClient.post('/assignments/process-expired'),
};
