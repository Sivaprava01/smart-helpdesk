import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { techniciansApi } from '../../api/technicians';
import { assignmentsApi } from '../../api/assignments';
import { ticketsApi } from '../../api/tickets';
import JobOfferCard from '../../components/technician/JobOfferCard';
import ActiveJobExecutionCard from '../../components/technician/ActiveJobExecutionCard';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';

export default function TechnicianPortalPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [technicians, setTechnicians] = useState([]);
  const [activeTechnician, setActiveTechnician] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState(null);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingShift, setTogglingShift] = useState(false);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState('PIPELINE'); // 'PIPELINE', 'OFFERS', 'HISTORY'

  // Load technician list and tickets with assignment history
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [techList, ticketList] = await Promise.all([
        techniciansApi.list(),
        ticketsApi.list(),
      ]);

      setTechnicians(techList || []);

      // Determine active technician
      let targetTech = null;
      if (user?.role === 'TECHNICIAN' && user?.technician_id) {
        targetTech = (techList || []).find((t) => t.id === user.technician_id);
      } else if (selectedTechId) {
        targetTech = (techList || []).find((t) => t.id === selectedTechId);
      } else if (techList && techList.length > 0) {
        targetTech = techList[0];
      }

      setActiveTechnician(targetTech);
      if (targetTech) {
        setSelectedTechId(targetTech.id);
      }

      // Fetch assignment histories for non-cancelled tickets to associate with active technician
      const activeOrRelevantTickets = (ticketList || []).filter(
        (t) => t.status !== 'CANCELLED'
      );

      const ticketAssignments = await Promise.all(
        activeOrRelevantTickets.map(async (t) => {
          try {
            const list = await assignmentsApi.listByTicket(t.id);
            return { ticketId: t.id, assignments: list || [] };
          } catch {
            return { ticketId: t.id, assignments: [] };
          }
        })
      );

      const enrichedTickets = (ticketList || []).map((t) => {
        const item = ticketAssignments.find((ta) => ta.ticketId === t.id);
        const assignments = item ? item.assignments : [];
        const activeAssignment = assignments.find(
          (a) => a.status === 'OFFERED' || a.status === 'DEFERRED'
        );
        const acceptedAssignment = assignments.find(
          (a) => a.status === 'ACCEPTED' || a.status === 'COMPLETED'
        );
        return {
          ...t,
          assignments,
          active_assignment: activeAssignment || null,
          accepted_assignment: acceptedAssignment || null,
        };
      });

      setAllTickets(enrichedTickets);
    } catch (err) {
      setError(err.message || 'Failed to load technician portal data.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedTechId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Shift Toggle (On Duty / Off Duty)
  async function handleToggleDuty() {
    if (!activeTechnician?.id) return;

    try {
      setTogglingShift(true);
      const updated = await techniciansApi.update(activeTechnician.id, {
        is_on_duty: !activeTechnician.is_on_duty,
      });
      setActiveTechnician(updated);
      showSuccess(`Shift status updated to: ${updated.is_on_duty ? 'ON DUTY' : 'OFF DUTY'}`);
    } catch (err) {
      showError(err.message || 'Failed to update shift status.');
    } finally {
      setTogglingShift(false);
    }
  }

  // Handle Offer Accept
  async function handleAcceptOffer(assignmentId) {
    try {
      await assignmentsApi.acceptAssignment(assignmentId, activeTechnician?.id);
      showSuccess('Job offer accepted! Ticket moved to assigned pipeline.');
      await loadData();
    } catch (err) {
      showError(err.message || 'Failed to accept job offer.');
    }
  }

  // Handle Offer Ask Later
  async function handleAskLater(assignmentId) {
    try {
      await assignmentsApi.deferAssignment(assignmentId, activeTechnician?.id);
      showSuccess('Offer deferred (Ask Me Later). You can decide before the timer expires.');
      await loadData();
    } catch (err) {
      showError(err.message || 'Failed to defer job offer.');
    }
  }

  // Handle Offer Decline
  async function handleDeclineOffer(assignmentId, declineData) {
    try {
      const res = await assignmentsApi.declineAssignment(assignmentId, declineData, activeTechnician?.id);
      const fallbackMsg = res?.fallback?.status === 'NEW_TECHNICIAN_OFFERED'
        ? `Offer declined. Rerouted to ${res.fallback.technician_name || 'alternative specialist'}.`
        : 'Offer declined. Automated fallback reroute triggered.';
      showSuccess(fallbackMsg);
      await loadData();
    } catch (err) {
      showError(err.message || 'Failed to decline job offer.');
    }
  }

  // Handle Field Lifecycle Actions
  async function handleArrive(ticketId) {
    try {
      await ticketsApi.markArrived(ticketId, activeTechnician?.id);
      showSuccess('Arrival confirmed! Ticket moved to ARRIVED state.');
      await loadData();
    } catch (err) {
      showError(err.message || 'Failed to record arrival.');
    }
  }

  async function handleStartWork(ticketId) {
    try {
      await ticketsApi.startWork(ticketId, activeTechnician?.id);
      showSuccess('Work started! Ticket moved to IN_PROGRESS state.');
      await loadData();
    } catch (err) {
      showError(err.message || 'Failed to start work.');
    }
  }

  async function handleCompleteWork(ticketId, data) {
    try {
      await ticketsApi.completeWork(ticketId, data, activeTechnician?.id);
      showSuccess('Work completed! Customer notified for resolution review.');
      await loadData();
    } catch (err) {
      showError(err.message || 'Failed to complete work.');
    }
  }

  // Filter Jobs for Active Technician
  const techJobs = useMemo(() => {
    if (!activeTechnician) return { offers: [], active: [], history: [] };

    const offers = [];
    const active = [];
    const history = [];

    allTickets.forEach((t) => {
      // 1. Pending Offers for this technician (OFFERED or DEFERRED in ROUTING status)
      const hasOfferForMe =
        t.status === 'ROUTING' &&
        t.active_assignment?.technician_id === activeTechnician.id;

      if (hasOfferForMe) {
        offers.push({ ticket: t, assignment: t.active_assignment });
        return;
      }

      // 2. Active Jobs for this technician (ASSIGNED, ARRIVED, IN_PROGRESS)
      const isMyActiveJob =
        (t.status === 'ASSIGNED' || t.status === 'ARRIVED' || t.status === 'IN_PROGRESS') &&
        (t.accepted_assignment?.technician_id === activeTechnician.id ||
          t.assignments?.some((a) => a.technician_id === activeTechnician.id && a.status === 'ACCEPTED'));

      if (isMyActiveJob) {
        active.push(t);
        return;
      }

      // 3. Completed / Historical Jobs for this technician
      const isMyCompletedJob =
        (t.status === 'AWAITING_CUSTOMER_CONFIRMATION' || t.status === 'RESOLVED' || t.status === 'CLOSED') &&
        (t.accepted_assignment?.technician_id === activeTechnician.id ||
          t.assignments?.some((a) => a.technician_id === activeTechnician.id && (a.status === 'ACCEPTED' || a.status === 'COMPLETED')));

      if (isMyCompletedJob) {
        history.push(t);
      }
    });

    return { offers, active, history };
  }, [allTickets, activeTechnician]);

  // Primary active job to feature on the execution stepper
  const currentExecutionJob =
    techJobs.active[0] ||
    (techJobs.history.length > 0 && techJobs.history[0].status === 'AWAITING_CUSTOMER_CONFIRMATION'
      ? techJobs.history[0]
      : null);

  return (
    <div className="pb-5">
      {/* Top Header with Technician Switcher (for Admins) & Brand */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-primary fill-1" style={{ fontSize: '28px' }}>
              engineering
            </span>
            <h1 className="font-headline h3 text-on-surface fw-bold mb-0">Technician Field Portal</h1>
          </div>
          <p className="text-secondary small mb-0 mt-1">
            Active assignment offers, field dispatch execution stepper, and shift status controls.
          </p>
        </div>

        {/* Admin/Dispatcher Specialist Switcher */}
        {user?.role !== 'TECHNICIAN' && technicians.length > 1 && (
          <div className="d-flex align-items-center gap-2 bg-white p-2 rounded-2 border border-outline-variant shadow-sm">
            <span className="font-label text-secondary small text-nowrap">VIEWING SPECIALIST:</span>
            <select
              className="form-select form-select-sm"
              style={{ minWidth: '180px' }}
              value={selectedTechId || ''}
              onChange={(e) => setSelectedTechId(e.target.value)}
            >
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name} ({tech.current_zone || 'Tower A'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="vstack gap-4">
          <SkeletonLoader type="card" count={3} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : !activeTechnician ? (
        <EmptyState
          icon="engineering"
          title="No Technician Account Found"
          description="Please ensure a technician record is provisioned and linked to this account."
        />
      ) : (
        <div className="vstack gap-4">
          {/* Top Controls: Shift Status & Workload Bar */}
          <div className="row g-3">
            {/* Shift Status Card */}
            <div className="col-12 col-md-6 col-lg-5">
              <div className="sh-card bg-white p-3 border border-outline-variant rounded-3 d-flex align-items-center justify-content-between h-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="font-label text-secondary small text-uppercase">DUTY STATUS:</div>
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`d-inline-block rounded-circle ${
                        activeTechnician.is_on_duty ? 'bg-success' : 'bg-secondary'
                      }`}
                      style={{ width: '12px', height: '12px', boxShadow: activeTechnician.is_on_duty ? '0 0 8px #22c55e' : undefined }}
                    ></span>
                    <span className="font-headline fw-bold text-on-surface" style={{ fontSize: '16px' }}>
                      {activeTechnician.is_on_duty ? 'On Duty' : 'Off Duty'}
                    </span>
                  </div>
                </div>

                <Button
                  variant={activeTechnician.is_on_duty ? 'outline-secondary' : 'primary'}
                  className="btn-sm py-1 px-3 font-label"
                  onClick={handleToggleDuty}
                  loading={togglingShift}
                  icon="power_settings_new"
                >
                  {activeTechnician.is_on_duty ? 'Go Off Duty' : 'Go On Duty'}
                </Button>
              </div>
            </div>

            {/* Workload Capacity Card */}
            <div className="col-12 col-md-6 col-lg-7">
              <div className="sh-card bg-white p-3 border border-outline-variant rounded-3 h-100 d-flex flex-column justify-content-center">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="font-label text-secondary small text-uppercase">CURRENT WORKLOAD</span>
                  <span className="font-mono text-primary fw-bold small">
                    {activeTechnician.current_workload} / {activeTechnician.max_workload} Active Jobs
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className={`progress-bar ${
                      activeTechnician.current_workload >= activeTechnician.max_workload
                        ? 'bg-danger'
                        : activeTechnician.current_workload > 0
                        ? 'bg-primary'
                        : 'bg-secondary'
                    }`}
                    role="progressbar"
                    style={{
                      width: `${Math.min(
                        100,
                        (activeTechnician.current_workload / (activeTechnician.max_workload || 1)) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section A: Active Offers */}
          {techJobs.offers.length > 0 && (
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-danger fill-1" style={{ fontSize: '20px' }}>
                  notification_important
                </span>
                <h2 className="font-headline h6 text-on-surface fw-bold mb-0">
                  Pending Assignment Offers ({techJobs.offers.length})
                </h2>
              </div>

              {techJobs.offers.map((offer) => (
                <JobOfferCard
                  key={offer.assignment.id}
                  ticket={offer.ticket}
                  assignment={offer.assignment}
                  onAccept={handleAcceptOffer}
                  onAskLater={handleAskLater}
                  onDecline={handleDeclineOffer}
                />
              ))}
            </div>
          )}

          {/* Section B: Current Execution Job Stepper */}
          {currentExecutionJob ? (
            <div>
              <ActiveJobExecutionCard
                ticket={currentExecutionJob}
                onArrive={handleArrive}
                onStartWork={handleStartWork}
                onCompleteWork={handleCompleteWork}
              />
            </div>
          ) : techJobs.offers.length === 0 ? (
            <EmptyState
              icon="task_alt"
              title="All Caught Up!"
              description="No active service jobs currently in progress. Stay on duty to receive incoming assignment offers from the dispatch engine."
            />
          ) : null}

          {/* Section C: Tabbed Jobs Pipeline */}
          <div className="sh-card bg-white border border-outline-variant rounded-3 overflow-hidden">
            <div className="d-flex border-bottom border-outline-variant px-3 pt-2 bg-surface-container-lowest gap-3 overflow-x-auto">
              <button
                type="button"
                className={`btn btn-link text-decoration-none font-label py-2 px-2 border-bottom border-2 ${
                  tab === 'PIPELINE' ? 'border-primary text-primary fw-bold' : 'border-transparent text-secondary'
                }`}
                style={{ fontSize: '12px' }}
                onClick={() => setTab('PIPELINE')}
              >
                Assigned Pipeline ({techJobs.active.length})
              </button>
              <button
                type="button"
                className={`btn btn-link text-decoration-none font-label py-2 px-2 border-bottom border-2 ${
                  tab === 'OFFERS' ? 'border-primary text-primary fw-bold' : 'border-transparent text-secondary'
                }`}
                style={{ fontSize: '12px' }}
                onClick={() => setTab('OFFERS')}
              >
                Offers & Deferred ({techJobs.offers.length})
              </button>
              <button
                type="button"
                className={`btn btn-link text-decoration-none font-label py-2 px-2 border-bottom border-2 ${
                  tab === 'HISTORY' ? 'border-primary text-primary fw-bold' : 'border-transparent text-secondary'
                }`}
                style={{ fontSize: '12px' }}
                onClick={() => setTab('HISTORY')}
              >
                Completed & Verified ({techJobs.history.length})
              </button>
            </div>

            <div className="p-3">
              {tab === 'PIPELINE' && (
                techJobs.active.length === 0 ? (
                  <div className="text-center py-4 text-secondary small">No active jobs in pipeline.</div>
                ) : (
                  <div className="vstack gap-2">
                    {techJobs.active.map((t) => {
                      const summary = t.description
                        ? t.description.length > 55
                          ? t.description.slice(0, 55) + '...'
                          : t.description
                        : t.title || 'Service Request';
                      const category = t.category?.name || t.service_category?.name || 'General';
                      const loc = t.location || t.customer?.default_location || 'Tower A';

                      return (
                        <div
                          key={t.id}
                          className="p-3 rounded bg-surface-container-lowest border border-outline-variant d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2"
                        >
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="font-mono text-primary fw-bold small">#{t.id.slice(0, 8).toUpperCase()}</span>
                              <span className="fw-semibold text-on-surface">{summary}</span>
                            </div>
                            <div className="text-secondary small font-mono">
                              {category} • Unit {loc}
                            </div>
                          </div>
                          <StatusBadge status={t.status} />
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {tab === 'OFFERS' && (
                techJobs.offers.length === 0 ? (
                  <div className="text-center py-4 text-secondary small">No pending offers.</div>
                ) : (
                  <div className="vstack gap-2">
                    {techJobs.offers.map((offer) => {
                      const summary = offer.ticket.description
                        ? offer.ticket.description.length > 55
                          ? offer.ticket.description.slice(0, 55) + '...'
                          : offer.ticket.description
                        : offer.ticket.title || 'Service Request';
                      const category = offer.ticket.category?.name || offer.ticket.service_category?.name || 'General';

                      return (
                        <div
                          key={offer.assignment.id}
                          className="p-3 rounded bg-surface-container-lowest border border-outline-variant d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-semibold text-on-surface">{summary}</div>
                            <div className="text-secondary small font-mono">
                              Category: {category} • Status: {offer.assignment.status}
                            </div>
                          </div>
                          <StatusBadge status={offer.ticket.status} />
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {tab === 'HISTORY' && (
                techJobs.history.length === 0 ? (
                  <div className="text-center py-4 text-secondary small">No completed service history yet.</div>
                ) : (
                  <div className="vstack gap-2">
                    {techJobs.history.map((t) => {
                      const summary = t.description
                        ? t.description.length > 55
                          ? t.description.slice(0, 55) + '...'
                          : t.description
                        : t.title || 'Service Request';
                      const loc = t.location || t.customer?.default_location || 'Tower A';

                      return (
                        <div
                          key={t.id}
                          className="p-3 rounded bg-surface-container-lowest border border-outline-variant d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-semibold text-on-surface">{summary}</div>
                            <div className="text-secondary small font-mono">
                              Completed • Unit {loc}
                            </div>
                          </div>
                          <StatusBadge status={t.status} />
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
