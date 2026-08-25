import { apiClient } from './client';

export const routingApi = {
  /**
   * Evaluates deterministic routing candidate scores for a ticket (strictly read-only).
   * @param {string} ticketId - Ticket UUID
   */
  previewRouting: (ticketId) => apiClient.get(`/tickets/${ticketId}/routing-preview`),
};
