import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatTile from '../../components/common/StatTile';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import { ticketsApi } from '../../api/tickets';
import { techniciansApi } from '../../api/technicians';
import { assignmentsApi } from '../../api/assignments';
import { useToast } from '../../context/ToastContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingExpired, setProcessingExpired] = useState(false);
  const [error, setError] = useState(null);

  const [activeQueueFilter, setActiveQueueFilter] = useState('ALL_ACTIVE');

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const [ticketList, techList] = await Promise.all([
        ticketsApi.list(),
        techniciansApi.list(),
      ]);
      setTickets(ticketList || []);
      setTechnicians(techList || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function handleProcessExpired() {
    try {
      setProcessingExpired(true);
      const res = await assignmentsApi.processExpired();
      const count = res?.expired_count || 0;
      showSuccess(
        count > 0
          ? `Processed ${count} timed-out offer(s) and rerouted to fallback specialists.`
          : 'No expired offers found at this time.'
      );
      loadDashboardData();
    } catch (err) {
      showError(err.message || 'Failed to process expired offers.');
    } finally {
      setProcessingExpired(false);
    }
  }

  // Compute KPI Metrics from real data
  const metrics = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter((t) => t.status === 'PENDING').length;
    const routing = tickets.filter((t) => t.status === 'ROUTING').length;
    const inProgress = tickets.filter(
      (t) => t.status === 'ARRIVED' || t.status === 'IN_PROGRESS'
    ).length;
    const awaitingConfirmation = tickets.filter(
      (t) => t.status === 'AWAITING_CUSTOMER_CONFIRMATION'
    ).length;
    const closed = tickets.filter((t) => t.status === 'CLOSED').length;
    const reopened = tickets.filter((t) => t.status === 'REOPENED').length;
    const active = total - closed - tickets.filter((t) => t.status === 'CANCELLED').length;

    return {
      total,
      active,
      pending,
      routing,
      inProgress,
      awaitingConfirmation,
      closed,
      reopened,
    };
  }, [tickets]);

  // Filter Live Queue
  const queueTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (activeQueueFilter === 'ALL_ACTIVE') {
        return t.status !== 'CLOSED' && t.status !== 'CANCELLED';
      }
      if (activeQueueFilter === 'PENDING') return t.status === 'PENDING';
      if (activeQueueFilter === 'ROUTING') return t.status === 'ROUTING';
      if (activeQueueFilter === 'IN_PROGRESS') {
        return t.status === 'ARRIVED' || t.status === 'IN_PROGRESS';
      }
      if (activeQueueFilter === 'AWAITING_CONFIRMATION') {
        return t.status === 'AWAITING_CUSTOMER_CONFIRMATION';
      }
      if (activeQueueFilter === 'REOPENED') return t.status === 'REOPENED';
      return true;
    });
  }, [tickets, activeQueueFilter]);

  // Split Technicians into On-Duty and Off-Duty
  const onDutyTechs = technicians.filter((t) => t.is_on_duty);
  const offDutyTechs = technicians.filter((t) => !t.is_on_duty);

  if (loading) {
    return (
      <div>
        <SkeletonLoader type="card" count={4} />
        <div className="row g-4 mt-3">
          <div className="col-8">
            <SkeletonLoader type="table" count={5} />
          </div>
          <div className="col-4">
            <SkeletonLoader type="card" count={2} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div>
      <PageHeader
        title="Operations & Dispatch Dashboard"
        subtitle="Real-time facility maintenance monitoring, deterministic dispatching, and specialist workload gauges."
        breadcrumbs={[{ label: 'Operations' }, { label: 'Dashboard' }]}
        actions={
          <div className="d-flex gap-2">
            <Button
              variant="secondary"
              icon="update"
              onClick={handleProcessExpired}
              loading={processingExpired}
            >
              Scan Expired Offers
            </Button>
            <Link to="/tickets/new" className="btn-sh-primary text-decoration-none">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                add
              </span>
              <span>+ New Ticket</span>
            </Link>
          </div>
        }
      />

      {/* Top KPI Metric Tiles Row (Matches Stitch 7b563b1b...) */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <StatTile
            title="ACTIVE TICKETS"
            value={metrics.active}
            subtitle="Currently unclosed"
            icon="receipt_long"
            accentColor="primary"
            onClick={() => setActiveQueueFilter('ALL_ACTIVE')}
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatTile
            title="PENDING DISPATCH"
            value={metrics.pending}
            subtitle="Needs assignment"
            icon="pending_actions"
            accentColor="warning"
            onClick={() => setActiveQueueFilter('PENDING')}
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatTile
            title="OFFERS IN ROUTING"
            value={metrics.routing}
            subtitle="Response window active"
            icon="autorenew"
            accentColor="info"
            onClick={() => setActiveQueueFilter('ROUTING')}
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatTile
            title="FIELD EXECUTION"
            value={metrics.inProgress}
            subtitle="Arrived & in progress"
            icon="engineering"
            accentColor="primary"
            onClick={() => setActiveQueueFilter('IN_PROGRESS')}
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatTile
            title="AWAITING CONFIRMATION"
            value={metrics.awaitingConfirmation}
            subtitle="Needs resident approval"
            icon="rate_review"
            accentColor="info"
            onClick={() => setActiveQueueFilter('AWAITING_CONFIRMATION')}
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatTile
            title="CLOSED / RESOLVED"
            value={metrics.closed}
            subtitle="Customer confirmed"
            icon="verified"
            accentColor="success"
          />
        </div>
      </div>

      {/* Main Content Split (2:1 Grid) */}
      <div className="row g-4">
        {/* Left Section: Live Service Queue */}
        <div className="col-12 col-xl-8">
          <div className="sh-card bg-white border border-outline-variant h-100 d-flex flex-column">
            {/* Header & Filter Pills */}
            <div className="p-3 border-bottom border-outline-variant d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <h3 className="font-headline h6 text-on-surface fw-bold mb-0">Live Service Queue</h3>
                <span className="text-secondary small">Real-time tickets requiring dispatch or field progress</span>
              </div>

              {/* Filter Pills */}
              <div className="d-flex flex-wrap gap-1 font-label" style={{ fontSize: '11px' }}>
                <button
                  type="button"
                  className={`btn btn-sm py-1 px-2 ${
                    activeQueueFilter === 'ALL_ACTIVE' ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setActiveQueueFilter('ALL_ACTIVE')}
                >
                  All ({metrics.active})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm py-1 px-2 ${
                    activeQueueFilter === 'PENDING' ? 'btn-warning' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setActiveQueueFilter('PENDING')}
                >
                  Pending ({metrics.pending})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm py-1 px-2 ${
                    activeQueueFilter === 'ROUTING' ? 'btn-info' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setActiveQueueFilter('ROUTING')}
                >
                  Routing ({metrics.routing})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm py-1 px-2 ${
                    activeQueueFilter === 'IN_PROGRESS' ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setActiveQueueFilter('IN_PROGRESS')}
                >
                  In Progress ({metrics.inProgress})
                </button>
              </div>
            </div>

            {/* Queue Table */}
            {queueTickets.length === 0 ? (
              <div className="p-5 text-center text-secondary my-auto">
                <span className="material-symbols-outlined display-5 mb-2 d-block text-secondary">
                  check_circle
                </span>
                <div className="fw-semibold">Queue is clear!</div>
                <div className="small">No active service tickets match the selected filter.</div>
              </div>
            ) : (
              <div className="table-responsive flex-grow-1">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-surface-container-low font-label text-secondary" style={{ fontSize: '11px' }}>
                    <tr>
                      <th className="ps-3">ID</th>
                      <th>Ticket Summary</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th className="text-end pe-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-body small" style={{ fontSize: '13px' }}>
                    {queueTickets.slice(0, 10).map((ticket) => {
                      const shortId = ticket.id.slice(0, 8).toUpperCase();
                      return (
                        <tr
                          key={ticket.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          <td className="ps-3 font-mono fw-semibold text-secondary">#{shortId}</td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <span className="fw-semibold text-on-surface">{ticket.title}</span>
                              {ticket.is_urgent && (
                                <span className="badge bg-danger text-white font-label" style={{ fontSize: '9px' }}>
                                  URGENT
                                </span>
                              )}
                            </div>
                            <div className="text-secondary small font-mono">
                              {ticket.customer?.full_name || 'Resident'}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-surface-container text-on-surface border border-outline-variant font-label" style={{ fontSize: '11px' }}>
                              {ticket.service_category?.name || 'General'}
                            </span>
                          </td>
                          <td>
                            <div className="text-on-surface small">{ticket.customer?.default_location || 'Tower A'}</div>
                          </td>
                          <td>
                            <StatusBadge status={ticket.status} />
                          </td>
                          <td className="text-end pe-3" onClick={(e) => e.stopPropagation()}>
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="btn btn-sm btn-outline-primary py-0 px-2"
                              style={{ fontSize: '11px' }}
                            >
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-2 border-top border-outline-variant text-center bg-surface-container-lowest">
              <Link to="/tickets" className="font-label text-primary text-decoration-none small">
                View All Tickets in Ticket Hub →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Section: Technician Availability & Capacity */}
        <div className="col-12 col-xl-4">
          <div className="sh-card bg-white border border-outline-variant p-3 h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-outline-variant">
              <div>
                <h3 className="font-headline h6 text-on-surface fw-bold mb-0">Specialist Capacity</h3>
                <span className="text-secondary small">Live shift status & workload gauges</span>
              </div>
              <Link to="/technicians" className="font-label text-primary text-decoration-none small">
                Manage →
              </Link>
            </div>

            {/* On Duty Specialists */}
            <div className="mb-3">
              <div className="font-label text-secondary mb-2 d-flex justify-content-between" style={{ fontSize: '10px' }}>
                <span>ON DUTY SPECIALISTS ({onDutyTechs.length})</span>
                <span className="text-success fw-bold">● Active Dispatch Pool</span>
              </div>

              {onDutyTechs.length === 0 ? (
                <div className="p-3 bg-surface-container-low rounded text-center small text-secondary">
                  No specialists are currently on duty.
                </div>
              ) : (
                <div className="vstack gap-2">
                  {onDutyTechs.map((tech) => {
                    const workloadPercent = Math.min(
                      100,
                      (tech.current_workload / (tech.max_concurrent_jobs || 1)) * 100
                    );
                    let barColor = 'bg-success';
                    if (workloadPercent >= 60) barColor = 'bg-warning';
                    if (workloadPercent >= 90) barColor = 'bg-danger';

                    return (
                      <div
                        key={tech.id}
                        className="p-2 bg-surface-container-lowest rounded border border-outline-variant"
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="fw-semibold text-on-surface small">{tech.name}</div>
                          <span className="font-mono small text-secondary" style={{ fontSize: '11px' }}>
                            ★ {tech.rating?.toFixed(2) || '5.00'}
                          </span>
                        </div>

                        {/* Workload Progress Bar */}
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px' }}>
                            <div
                              className={`progress-bar ${barColor}`}
                              style={{ width: `${workloadPercent}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-secondary small" style={{ fontSize: '10px' }}>
                            {tech.current_workload}/{tech.max_concurrent_jobs}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Off Duty Specialists */}
            {offDutyTechs.length > 0 && (
              <div className="mt-auto pt-2 border-top border-outline-variant">
                <div className="font-label text-secondary mb-1" style={{ fontSize: '10px' }}>
                  OFF DUTY ({offDutyTechs.length})
                </div>
                <div className="text-secondary small font-mono">
                  {offDutyTechs.map((t) => t.name).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
