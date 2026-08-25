import { apiClient } from './client';

export const assignmentsApi = {
  /**
   * Dispatches initial assignment for a ticket.
   * @param {string} ticketId - Ticket UUID
   */
  startAssignment: (ticketId) => apiClient.post(`/assignments/ticket/${ticketId}/start`),

  /**
   * Retrieves all assignment attempts for a ticket.
   * @param {string} ticketId - Ticket UUID
   */
  listByTicket: (ticketId) => apiClient.get(`/assignments/ticket/${ticketId}`),

  /**
   * Retrieves currently active assignment for a ticket.
   * @param {string} ticketId - Ticket UUID
   */
  getActiveForTicket: (ticketId) => apiClient.get(`/assignments/ticket/${ticketId}/active`),

  /**
   * Accepts an offered assignment.
   * @param {string} assignmentId - Assignment UUID
   */
  accept: (assignmentId) => apiClient.post(`/assignments/${assignmentId}/accept`),

  /**
   * Declines an assignment offer with controlled reason and optional note.
   * @param {string} assignmentId - Assignment UUID
   * @param {Object} data - { reason: 'BUSY' | 'NOT_FEELING_WELL' | 'ENDING_SHIFT' | 'PERSONAL_REASON' | 'OTHER', note?: string }
   */
  decline: (assignmentId, data) => apiClient.post(`/assignments/${assignmentId}/decline`, data),

  /**
   * Defers an assignment offer ("Ask Me Later" 10-min extension).
   * @param {string} assignmentId - Assignment UUID
   */
  defer: (assignmentId) => apiClient.post(`/assignments/${assignmentId}/ask-later`),

  /**
   * Triggers batch scanner to expire timed-out offers and fallback reroute.
   */
  processExpired: () => apiClient.post('/assignments/process-expired'),
};
