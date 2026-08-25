import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatTile from '../../components/common/StatTile';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import ActiveOfferTimer from '../../components/routing/ActiveOfferTimer';
import RoutingInspector from '../../components/routing/RoutingInspector';
import { ticketsApi } from '../../api/tickets';
import { techniciansApi } from '../../api/technicians';
import { assignmentsApi } from '../../api/assignments';
import { useToast } from '../../context/ToastContext';

export default function RoutingMonitorPage() {
  const { showSuccess, showError } = useToast();

  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanningExpired, setScanningExpired] = useState(false);
  const [error, setError] = useState(null);

  const [queueTab, setQueueTab] = useState('ALL'); // 'ALL', 'ROUTING', 'PENDING', 'REOPENED'

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketList, techList] = await Promise.all([
        ticketsApi.list(),
        techniciansApi.list(),
      ]);

      // Filter tickets that are in routing-relevant states: ROUTING, PENDING, REOPENED
      const routableTickets = (ticketList || []).filter(
        (t) => t.status === 'ROUTING' || t.status === 'PENDING' || t.status === 'REOPENED' || t.status === 'ASSIGNED'
      );

      setTickets(routableTickets);
      setTechnicians(techList || []);

      // Auto-select first ticket if none currently selected
      if (routableTickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(routableTickets[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load routing monitor data.');
    } finally {
      setLoading(false);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleScanExpired() {
    try {
      setScanningExpired(true);
      const res = await assignmentsApi.processExpired();
      const count = res?.expired_count || 0;
      showSuccess(
        count > 0
          ? `Processed ${count} timed-out offer(s) and automatically triggered fallback rerouting.`
          : 'No expired offers found at this time. All active response timers are within limits.'
      );
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to process expired offers.');
    } finally {
      setScanningExpired(false);
    }
  }

  // Compute Metrics
  const metrics = useMemo(() => {
    const routingCount = tickets.filter((t) => t.status === 'ROUTING').length;
    const pendingCount = tickets.filter((t) => t.status === 'PENDING').length;
    const reopenedCount = tickets.filter((t) => t.status === 'REOPENED').length;
    const onDutyTechs = technicians.filter((t) => t.is_on_duty).length;

    return {
      routingCount,
      pendingCount,
      reopenedCount,
      onDutyTechs,
    };
  }, [tickets, technicians]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return tickets.filter((t) => {
      if (queueTab === 'ROUTING') return t.status === 'ROUTING';
      if (queueTab === 'PENDING') return t.status === 'PENDING';
      if (queueTab === 'REOPENED') return t.status === 'REOPENED';
      return true;
    });
  }, [tickets, queueTab]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || filteredQueue[0] || null;

  return (
    <div>
      <PageHeader
        title="Routing & Fallback Monitor"
        subtitle="Real-time dispatching engine, multi-factor deterministic candidate scoring, and automated fallback timeout monitors."
        breadcrumbs={[{ label: 'Operations', href: '/dashboard' }, { label: 'Routing Engine' }]}
        actions={
          <div className="d-flex gap-2">
            <Button
              variant="secondary"
              icon="refresh"
              onClick={loadData}
              loading={loading}
            >
              Refresh Queue
            </Button>
            <Button
              variant="primary"
              icon="update"
              onClick={handleScanExpired}
              loading={scanningExpired}
            >
              Scan Expired Offers
            </Button>
          </div>
        }
      />

      {/* Top KPI Metric Tiles Row (Matches Stitch 78d84ad6...) */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatTile
            title="ACTIVE OFFERS (ROUTING)"
            value={metrics.routingCount}
            subtitle="Specialist 15-min timers active"
            icon="send"
            accentColor="info"
            onClick={() => setQueueTab('ROUTING')}
          />
        </div>
        <div className="col-6 col-md-3">
          <StatTile
            title="PENDING DISPATCH"
            value={metrics.pendingCount}
            subtitle="Ready for candidate scoring"
            icon="pending_actions"
            accentColor="warning"
            onClick={() => setQueueTab('PENDING')}
          />
        </div>
        <div className="col-6 col-md-3">
          <StatTile
            title="FALLBACK REROUTING"
            value={metrics.reopenedCount}
            subtitle="Issue unresolved / alternate tech"
            icon="alt_route"
            accentColor="danger"
            onClick={() => setQueueTab('REOPENED')}
          />
        </div>
        <div className="col-6 col-md-3">
          <StatTile
            title="ON-DUTY SPECIALIST POOL"
            value={metrics.onDutyTechs}
            subtitle="Active technicians ready"
            icon="groups"
            accentColor="success"
          />
        </div>
      </div>

      {/* Main Content Area (2:1 Grid) */}
      {loading ? (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <SkeletonLoader type="table" count={5} />
          </div>
          <div className="col-12 col-lg-4">
            <SkeletonLoader type="card" count={2} />
          </div>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : tickets.length === 0 ? (
        /* Empty State Matching Stitch af7281c3... */
        <EmptyState
          icon="radar"
          title="Routing Queue is Clear"
          description="There are currently no tickets in PENDING, ROUTING, or REOPENED states requiring specialist dispatch."
          actionLabel="Create Service Request"
          onAction={() => window.location.assign('/tickets/new')}
        />
      ) : (
        <div className="row g-4">
          {/* Left Column: Active Offers Table */}
          <div className="col-12 col-lg-7 col-xl-8">
            <div className="sh-card bg-white border border-outline-variant rounded-3 overflow-hidden h-100 d-flex flex-column">
              {/* Table Header & Tabs */}
              <div className="p-3 border-bottom border-outline-variant d-flex flex-wrap justify-content-between align-items-center gap-2 bg-surface-container-lowest">
                <div className="d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                    radar
                  </span>
                  <h3 className="font-headline h6 text-on-surface fw-bold mb-0">Active Routing Queue</h3>
                </div>

                {/* Filter Tabs */}
                <div className="d-flex gap-1 font-label" style={{ fontSize: '11px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm py-1 px-2 ${queueTab === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setQueueTab('ALL')}
                  >
                    All ({tickets.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm py-1 px-2 ${queueTab === 'ROUTING' ? 'btn-info text-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setQueueTab('ROUTING')}
                  >
                    Routing ({metrics.routingCount})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm py-1 px-2 ${queueTab === 'PENDING' ? 'btn-warning' : 'btn-outline-secondary'}`}
                    onClick={() => setQueueTab('PENDING')}
                  >
                    Pending ({metrics.pendingCount})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm py-1 px-2 ${queueTab === 'REOPENED' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => setQueueTab('REOPENED')}
                  >
                    Reopened ({metrics.reopenedCount})
                  </button>
                </div>
              </div>

              {/* Queue Table */}
              <div className="table-responsive flex-grow-1">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-surface-container-low font-label text-secondary" style={{ fontSize: '11px' }}>
                    <tr>
                      <th className="ps-3" style={{ width: '95px' }}>Ticket ID</th>
                      <th>Summary & Customer</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Response Timer</th>
                      <th className="text-end pe-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="font-body small" style={{ fontSize: '13px' }}>
                    {filteredQueue.map((t) => {
                      const shortId = t.id.slice(0, 8).toUpperCase();
                      const isSelected = selectedTicket?.id === t.id;

                      return (
                        <tr
                          key={t.id}
                          className={`cursor-pointer transition-all ${
                            isSelected ? 'table-active border-start border-3 border-primary' : ''
                          }`}
                          onClick={() => setSelectedTicketId(t.id)}
                        >
                          <td className="ps-3 font-mono fw-bold text-primary">
                            #{shortId}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <span className="fw-semibold text-on-surface">{t.title}</span>
                              {t.is_urgent && (
                                <span className="badge bg-danger text-white font-label" style={{ fontSize: '9px' }}>
                                  URGENT
                                </span>
                              )}
                            </div>
                            <div className="text-secondary small font-mono">
                              {t.customer?.full_name || 'Resident'} • {t.customer?.default_location || 'Tower A'}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-surface-container text-on-surface border border-outline-variant font-label" style={{ fontSize: '11px' }}>
                              {t.service_category?.name || 'General'}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={t.status} />
                          </td>
                          <td>
                            {t.status === 'ROUTING' ? (
                              <ActiveOfferTimer offeredAt={t.updated_at} onExpired={loadData} />
                            ) : (
                              <span className="text-secondary font-mono small">—</span>
                            )}
                          </td>
                          <td className="text-end pe-3" onClick={(e) => e.stopPropagation()}>
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                type="button"
                                className={`btn btn-sm py-0 px-2 font-label ${
                                  isSelected ? 'btn-primary' : 'btn-outline-primary'
                                }`}
                                style={{ fontSize: '11px' }}
                                onClick={() => setSelectedTicketId(t.id)}
                              >
                                {isSelected ? 'Inspecting' : 'Inspect'}
                              </button>
                              <Link
                                to={`/tickets/${t.id}`}
                                className="btn btn-sm btn-outline-secondary py-0 px-2"
                                style={{ fontSize: '11px' }}
                              >
                                Details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-2 border-top border-outline-variant text-center bg-surface-container-lowest text-secondary small font-label">
                Click any ticket to inspect live candidate scoring calculations in the side panel
              </div>
            </div>
          </div>

          {/* Right Column: Deterministic Routing Inspector */}
          <div className="col-12 col-lg-5 col-xl-4">
            <RoutingInspector
              ticket={selectedTicket}
              onDispatched={() => loadData()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
