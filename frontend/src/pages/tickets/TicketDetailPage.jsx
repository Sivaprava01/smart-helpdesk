import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import ErrorState from '../../components/common/ErrorState';
import TicketLifecycleStepper from '../../components/tickets/TicketLifecycleStepper';
import RoutingPreviewModal from '../../components/tickets/RoutingPreviewModal';
import { ticketsApi } from '../../api/tickets';
import { assignmentsApi } from '../../api/assignments';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [ticket, setTicket] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);

  const loadTicketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketData, assignmentList, feedbackList] = await Promise.all([
        ticketsApi.getById(id),
        assignmentsApi.listByTicket(id).catch(() => []),
        ticketsApi.getFeedbacks(id).catch(() => []),
      ]);
      setTicket(ticketData);
      setAssignments(assignmentList || []);
      setFeedbacks(feedbackList || []);
    } catch (err) {
      setError(err.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicketData();
  }, [loadTicketData]);

  async function handleDispatch() {
    try {
      setActionLoading(true);
      await assignmentsApi.startAssignment(id);
      showSuccess('Assignment offer successfully dispatched to top-ranked technician.');
      loadTicketData();
    } catch (err) {
      showError(err.message || 'Failed to dispatch ticket.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this pending service request?')) return;
    try {
      setActionLoading(true);
      await ticketsApi.cancel(id);
      showSuccess('Ticket has been cancelled.');
      loadTicketData();
    } catch (err) {
      showError(err.message || 'Failed to cancel ticket.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <SkeletonLoader type="card" count={1} />
        <div className="row g-4 mt-2">
          <div className="col-8">
            <SkeletonLoader type="card" count={2} />
          </div>
          <div className="col-4">
            <SkeletonLoader type="card" count={2} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return <ErrorState message={error || 'Ticket not found'} onRetry={loadTicketData} />;
  }

  const shortId = ticket.id.slice(0, 8).toUpperCase();
  const isScheduled = Boolean(ticket.scheduled_for);
  const canDispatch = ticket.status === 'PENDING' || ticket.status === 'REOPENED';
  const canCancel = ticket.status === 'PENDING';
  const activeAssignment = assignments.find(
    (a) => a.status === 'OFFERED' || a.status === 'DEFERRED' || a.status === 'ACCEPTED'
  );

  return (
    <div>
      <PageHeader
        title={`Service Ticket #${shortId}`}
        subtitle={`Created on ${new Date(ticket.created_at).toLocaleDateString([], {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`}
        breadcrumbs={[
          { label: 'Operations', href: '/dashboard' },
          { label: 'Tickets', href: '/tickets' },
          { label: `#${shortId}` },
        ]}
        actions={
          <div className="d-flex gap-2 align-items-center">
            <Button variant="secondary" icon="refresh" onClick={loadTicketData} loading={actionLoading}>
              Refresh
            </Button>
            <Button
              variant="secondary"
              icon="analytics"
              onClick={() => setIsRoutingModalOpen(true)}
            >
              Preview Routing
            </Button>
            {canDispatch && (
              <Button
                variant="primary"
                icon="send"
                onClick={handleDispatch}
                loading={actionLoading}
              >
                Dispatch Offer
              </Button>
            )}
            {canCancel && (
              <Button
                variant="danger"
                icon="cancel"
                onClick={handleCancel}
                loading={actionLoading}
              >
                Cancel Ticket
              </Button>
            )}
          </div>
        }
      />

      {/* Ticket Status Bar & Lifecycle Stepper (Matches Stitch 334dd6c0...) */}
      <div className="mb-4">
        <TicketLifecycleStepper status={ticket.status} />
      </div>

      <div className="row g-4">
        {/* Left Column: Problem Summary & History */}
        <div className="col-12 col-lg-8">
          {/* Issue Overview Card */}
          <div className="sh-card bg-white p-4 mb-4 border border-outline-variant">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge bg-surface-container text-on-surface border border-outline-variant font-label" style={{ fontSize: '11px' }}>
                    {ticket.service_category?.name || 'General Maintenance'}
                  </span>
                  {ticket.is_urgent && (
                    <span className="badge bg-danger text-white font-label" style={{ fontSize: '10px' }}>
                      ⚡ HIGH PRIORITY / URGENT
                    </span>
                  )}
                </div>
                <h3 className="font-headline h5 text-on-surface fw-bold mb-0">{ticket.title}</h3>
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant mb-4">
              <div className="font-label text-secondary mb-1" style={{ fontSize: '11px' }}>
                DETAILED PROBLEM DESCRIPTION
              </div>
              <p className="font-body text-on-surface mb-0" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {ticket.description}
              </p>
            </div>

            {/* Resident & Scheduling Grid */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className="p-3 bg-surface-container-low rounded border border-outline-variant h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                      person
                    </span>
                    <span className="font-label text-secondary" style={{ fontSize: '11px' }}>
                      CUSTOMER CONTACT
                    </span>
                  </div>
                  <div className="fw-semibold text-on-surface">
                    {ticket.customer?.full_name || 'Resident'}
                  </div>
                  <div className="text-secondary small font-mono">{ticket.customer?.phone_number || '---'}</div>
                  <div className="text-secondary small">{ticket.customer?.email || '---'}</div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 bg-surface-container-low rounded border border-outline-variant h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                      location_on
                    </span>
                    <span className="font-label text-secondary" style={{ fontSize: '11px' }}>
                      SERVICE LOCATION & TIMING
                    </span>
                  </div>
                  <div className="fw-semibold text-on-surface">
                    {ticket.customer?.default_location || 'Unit Location'}
                  </div>
                  <div className="d-flex align-items-center gap-1 mt-1">
                    {isScheduled ? (
                      <span className="badge bg-primary-subtle text-primary font-label" style={{ fontSize: '10px' }}>
                        Scheduled: {new Date(ticket.scheduled_for).toLocaleString()}
                      </span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning-emphasis font-label" style={{ fontSize: '10px' }}>
                        ⚡ ASAP (Immediate Service)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Assignment Attempts Timeline */}
          <div className="sh-card bg-white p-4 mb-4 border border-outline-variant">
            <h3 className="font-headline h6 text-on-surface mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
              <span className="material-symbols-outlined text-primary">history</span>
              <span>Specialist Assignment & Dispatch History ({assignments.length})</span>
            </h3>

            {assignments.length === 0 ? (
              <div className="text-secondary small py-3 text-center">
                No assignment attempts have been recorded yet. Click "Dispatch Offer" to trigger routing.
              </div>
            ) : (
              <div className="vstack gap-3">
                {assignments.map((attempt, index) => {
                  let badgeBg = 'bg-secondary';
                  if (attempt.status === 'OFFERED') badgeBg = 'bg-info text-dark';
                  if (attempt.status === 'ACCEPTED') badgeBg = 'bg-primary text-white';
                  if (attempt.status === 'COMPLETED') badgeBg = 'bg-success text-white';
                  if (attempt.status === 'DECLINED') badgeBg = 'bg-warning text-dark';
                  if (attempt.status === 'EXPIRED') badgeBg = 'bg-danger text-white';

                  return (
                    <div
                      key={attempt.id}
                      className="p-3 bg-surface-container-lowest rounded border border-outline-variant"
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="font-mono fw-bold text-secondary" style={{ fontSize: '12px' }}>
                            Attempt #{index + 1}
                          </span>
                          <span className="fw-semibold text-on-surface">
                            {attempt.technician?.name || 'Technician'}
                          </span>
                        </div>
                        <span className={`badge ${badgeBg} font-label`} style={{ fontSize: '10px' }}>
                          {attempt.status}
                        </span>
                      </div>

                      {/* Timestamps & Notes */}
                      <div className="row g-2 text-secondary font-mono small" style={{ fontSize: '11px' }}>
                        <div className="col-sm-6">
                          Offered: {new Date(attempt.offered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {attempt.responded_at && (
                          <div className="col-sm-6">
                            Responded: {new Date(attempt.responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>

                      {/* Decline Reason */}
                      {attempt.status === 'DECLINED' && (
                        <div className="mt-2 p-2 bg-warning-subtle rounded text-warning-emphasis small">
                          <strong>Decline Reason:</strong> {attempt.decline_reason || 'Busy'}
                          {attempt.decline_note && ` — "${attempt.decline_note}"`}
                        </div>
                      )}

                      {/* Execution Details if Completed */}
                      {attempt.completion_notes && (
                        <div className="mt-2 p-2 bg-success-subtle rounded text-success-emphasis small">
                          <strong>Technician Completion Notes:</strong> "{attempt.completion_notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer Feedback Review Card (If present) */}
          {feedbacks.length > 0 && (
            <div className="sh-card bg-white p-4 border border-outline-variant">
              <h3 className="font-headline h6 text-on-surface mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <span className="material-symbols-outlined text-primary">verified</span>
                <span>Customer Resolution & Quality Review</span>
              </h3>

              {feedbacks.map((fb) => (
                <div key={fb.id} className="p-3 bg-surface-container-low rounded border border-outline-variant mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={`badge ${fb.is_resolved ? 'bg-success' : 'bg-danger'} font-label`}>
                      {fb.is_resolved ? '✓ Confirmed Resolved by Resident' : '✕ Reported Unresolved (Reopened)'}
                    </span>
                    {fb.rating && (
                      <span className="fw-bold text-warning font-mono" style={{ fontSize: '14px' }}>
                        {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)} ({fb.rating}/5)
                      </span>
                    )}
                  </div>
                  {fb.notes && (
                    <div className="text-secondary small font-body">
                      "{fb.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Assignment & Dispatcher Actions */}
        <div className="col-12 col-lg-4">
          {/* Active Assignment Card */}
          <div className="sh-card bg-white p-4 mb-4 border border-outline-variant">
            <h3 className="font-headline h6 text-on-surface mb-3 border-bottom pb-2">
              Active Assignment
            </h3>

            {activeAssignment ? (
              <div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
                    style={{ width: '44px', height: '44px' }}
                  >
                    {activeAssignment.technician?.name?.slice(0, 1) || 'T'}
                  </div>
                  <div>
                    <div className="fw-bold text-on-surface">{activeAssignment.technician?.name}</div>
                    <div className="text-secondary small font-mono">{activeAssignment.technician?.phone_number || '---'}</div>
                    <div className="badge bg-primary-subtle text-primary font-label mt-1" style={{ fontSize: '10px' }}>
                      Status: {activeAssignment.status}
                    </div>
                  </div>
                </div>

                {activeAssignment.status === 'OFFERED' && (
                  <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-0">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      timer
                    </span>
                    <div>Offer sent. Specialist has a 15-minute response window.</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-surface-container-low rounded border border-outline-variant text-center small text-secondary">
                No active specialist assignment.
                {canDispatch && (
                  <div className="mt-2">
                    <Button variant="primary" size="sm" onClick={handleDispatch} loading={actionLoading}>
                      Dispatch Now
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="sh-card bg-surface-container-low p-4 border border-outline-variant">
            <div className="font-label text-secondary mb-3" style={{ fontSize: '11px' }}>
              DISPATCHER ACTIONS
            </div>
            <div className="vstack gap-2">
              <Button
                variant="secondary"
                className="w-100 justify-content-center"
                onClick={() => setIsRoutingModalOpen(true)}
              >
                Inspect Routing Engine
              </Button>
              {canDispatch && (
                <Button
                  variant="primary"
                  className="w-100 justify-content-center"
                  onClick={handleDispatch}
                  loading={actionLoading}
                >
                  Dispatch to Specialist
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Routing Preview Modal */}
      <RoutingPreviewModal
        isOpen={isRoutingModalOpen}
        onClose={() => setIsRoutingModalOpen(false)}
        ticketId={id}
      />
    </div>
  );
}
