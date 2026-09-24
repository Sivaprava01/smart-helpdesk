import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import ErrorState from '../../components/common/ErrorState';
import TicketLifecycleStepper from '../../components/tickets/TicketLifecycleStepper';
import RoutingPreviewModal from '../../components/tickets/RoutingPreviewModal';
import ServiceResolutionCard from '../../components/tickets/ServiceResolutionCard';
import FeedbackHistoryCard from '../../components/tickets/FeedbackHistoryCard';
import AssignmentHistoryTimeline from '../../components/tickets/AssignmentHistoryTimeline';
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
      await loadTicketData();
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
      await loadTicketData();
    } catch (err) {
      showError(err.message || 'Failed to cancel ticket.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-4">
        <SkeletonLoader type="card" count={1} />
        <div className="row g-4 mt-2">
          <div className="col-12 col-lg-8">
            <SkeletonLoader type="card" count={3} />
          </div>
          <div className="col-12 col-lg-4">
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
  const isCustomer = user?.role === 'CUSTOMER';
  const isAdminOrDispatcher = user?.role === 'ADMIN' || user?.role === 'DISPATCHER';
  const isOwnTicket = isCustomer && (!ticket.customer_id || ticket.customer_id === user?.customer_id);
  const canCancel = ticket.status === 'PENDING' && (isAdminOrDispatcher || isOwnTicket);

  const assignedSpecialist =
    assignments.find((a) => a.status === 'ACCEPTED' || a.status === 'COMPLETED') ||
    assignments.find((a) => a.status === 'OFFERED' || a.status === 'DEFERRED') ||
    null;

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
        breadcrumbs={
          isAdminOrDispatcher
            ? [
                { label: 'Operations', href: '/dashboard' },
                { label: 'Tickets', href: '/tickets' },
                { label: `#${shortId}` },
              ]
            : [
                { label: 'Tickets', href: '/tickets' },
                { label: `#${shortId}` },
              ]
        }
        actions={
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <Button variant="secondary" icon="refresh" onClick={loadTicketData} loading={actionLoading}>
              Refresh
            </Button>

            {isAdminOrDispatcher && (
              <Button
                variant="secondary"
                icon="analytics"
                onClick={() => setIsRoutingModalOpen(true)}
              >
                Preview Routing
              </Button>
            )}

            {canDispatch && isAdminOrDispatcher && (
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

      {/* Ticket Status Bar & Full Lifecycle Stepper (Matches Stitch 334dd6c0...) */}
      <div className="mb-4">
        <TicketLifecycleStepper status={ticket.status} />
      </div>

      {/* Reopened Alert Banner if ticket was reopened */}
      {ticket.status === 'REOPENED' && (
        <div className="alert alert-danger p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-danger" style={{ fontSize: '24px' }}>
              warning
            </span>
            <div>
              <strong className="d-block">Ticket Reopened by Resident:</strong>
              <span className="small">The previous maintenance work was marked unresolved. Ready for alternative specialist dispatch.</span>
            </div>
          </div>
          {isAdminOrDispatcher && (
            <Button variant="danger" className="btn-sm" onClick={handleDispatch} loading={actionLoading}>
              Dispatch Alternative Specialist
            </Button>
          )}
        </div>
      )}

      {/* Customer Resolution Verification Section (Strictly restricted to CUSTOMER role) */}
      {isCustomer && ticket.status === 'AWAITING_CUSTOMER_CONFIRMATION' && (
        <ServiceResolutionCard
          ticket={ticket}
          customerId={user?.customer_id}
          onResolved={() => loadTicketData()}
        />
      )}

      {/* Non-Customer Informational Banner when awaiting confirmation */}
      {!isCustomer && ticket.status === 'AWAITING_CUSTOMER_CONFIRMATION' && (
        <div className="alert alert-info p-3 mb-4 rounded-3 d-flex align-items-center gap-3 border-info">
          <span className="material-symbols-outlined text-info" style={{ fontSize: '24px' }}>
            hourglass_top
          </span>
          <div>
            <strong className="d-block text-on-surface">Awaiting Resident Confirmation</strong>
            <span className="small text-secondary">
              The assigned technician has submitted service completion notes. The ticket is currently awaiting resident verification and feedback.
            </span>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Problem Summary, Feedback History, & Assignment Attempts */}
        <div className="col-12 col-lg-8">
          {/* Issue Overview Card */}
          <div className="sh-card bg-white p-4 mb-4 border border-outline-variant rounded-3">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge bg-surface-container text-on-surface border border-outline-variant font-label" style={{ fontSize: '11px' }}>
                    {ticket.category?.name || ticket.service_category?.name || 'General Maintenance'}
                  </span>
                  {ticket.is_urgent && (
                    <span className="badge bg-danger text-white font-label" style={{ fontSize: '10px' }}>
                      ⚡ HIGH PRIORITY / URGENT
                    </span>
                  )}
                </div>
                <h3 className="font-headline h5 text-on-surface fw-bold mb-0">
                  {ticket.description?.length > 60 ? ticket.description.slice(0, 60) + '...' : ticket.description}
                </h3>
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
          <AssignmentHistoryTimeline assignments={assignments} />

          {/* Resident Feedback & Verification History */}
          <FeedbackHistoryCard feedbacks={feedbacks} />
        </div>

        {/* Right Column: Active Assignment & Field Execution State */}
        <div className="col-12 col-lg-4">
          {/* Active Technician Card */}
          <div className="sh-card bg-white p-4 mb-4 border border-outline-variant rounded-3">
            <h3 className="font-headline h6 text-on-surface mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
              <span className="material-symbols-outlined text-primary">engineering</span>
              <span>Assigned Specialist</span>
            </h3>

            {assignedSpecialist ? (
              <div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
                    style={{ width: '44px', height: '44px', fontSize: '16px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                      engineering
                    </span>
                  </div>
                  <div>
                    <div className="fw-bold text-on-surface">
                      Specialist #{assignedSpecialist.technician_id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="text-secondary small font-mono">
                      {assignedSpecialist.status === 'ACCEPTED'
                        ? 'Active Assignment'
                        : assignedSpecialist.status === 'COMPLETED'
                        ? 'Work Completed'
                        : 'Offer Pending'}
                    </div>
                  </div>
                </div>

                <div className="vstack gap-2 small">
                  <div className="d-flex justify-content-between py-1 border-bottom border-outline-variant">
                    <span className="text-secondary">Technician ID:</span>
                    <span className="fw-semibold font-mono">{assignedSpecialist.technician_id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-outline-variant">
                    <span className="text-secondary">Assignment Status:</span>
                    <span className="fw-semibold font-mono">{assignedSpecialist.status}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom border-outline-variant">
                    <span className="text-secondary">Assigned At:</span>
                    <span className="fw-semibold font-mono">
                      {new Date(assignedSpecialist.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-secondary small">
                <span className="material-symbols-outlined display-6 text-secondary opacity-50 mb-2">
                  person_search
                </span>
                <div>No specialist currently assigned.</div>
                <div className="text-secondary opacity-75">Dispatch offer to start deterministic routing.</div>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="sh-card bg-surface-container-lowest p-3 border border-outline-variant rounded-3">
            <span className="font-label text-secondary small d-block mb-2 text-uppercase">
              Quick Navigation
            </span>
            <div className="vstack gap-2">
              <Link to="/tickets" className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-between">
                <span>View All Tickets</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </Link>
              {isAdminOrDispatcher && (
                <Link to="/routing" className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-between">
                  <span>Routing Engine Monitor</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deterministic Routing Preview Modal */}
      <RoutingPreviewModal
        isOpen={isRoutingModalOpen}
        onClose={() => setIsRoutingModalOpen(false)}
        ticketId={ticket.id}
      />
    </div>
  );
}
