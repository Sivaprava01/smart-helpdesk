import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { ticketsApi } from '../../api/tickets';
import { categoriesApi } from '../../api/categories';
import { assignmentsApi } from '../../api/assignments';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function TicketListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const isCustomer = user?.role === 'CUSTOMER';
  const isAdminOrDispatcher = user?.role === 'ADMIN' || user?.role === 'DISPATCHER';

  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingExpired, setProcessingExpired] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 15;

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const params = isCustomer && user?.customer_id ? { customer_id: user.customer_id } : {};
      const [ticketList, catList] = await Promise.all([
        ticketsApi.list(params),
        categoriesApi.list(),
      ]);
      setTickets(ticketList || []);
      setCategories(catList || []);
    } catch (err) {
      setError(err.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  async function handleProcessExpired() {
    try {
      setProcessingExpired(true);
      const res = await assignmentsApi.processExpired();
      const count = res?.expired_count || 0;
      showSuccess(
        count > 0
          ? `Processed ${count} expired offer(s) and triggered fallback routing.`
          : 'No expired offers found at this time.'
      );
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to process expired offers.');
    } finally {
      setProcessingExpired(false);
    }
  }

  async function handleCancelTicket(e, ticketId) {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this pending service request?')) return;

    try {
      await ticketsApi.cancel(ticketId);
      showSuccess('Ticket has been cancelled.');
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to cancel ticket.');
    }
  }

  // Filtered List
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // If Customer, restrict strictly to own customer tickets
      if (isCustomer && user?.customer_id && t.customer_id && t.customer_id !== user.customer_id) {
        return false;
      }

      // Search filter (ID, Description, Customer Name, Contact Name)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesId = t.id?.toLowerCase().includes(query);
        const matchesCust = t.customer?.full_name?.toLowerCase().includes(query);
        const matchesContact = t.contact_name?.toLowerCase().includes(query);
        if (!matchesDesc && !matchesId && !matchesCust && !matchesContact) return false;
      }

      // Status filter
      if (statusFilter && t.status !== statusFilter) return false;

      // Category filter (uses category_id with fallback to category.id)
      if (categoryFilter && (t.category_id || t.category?.id) !== categoryFilter) return false;

      // Urgency filter
      if (urgentOnly && !t.is_urgent) return false;

      return true;
    });
  }, [tickets, searchTerm, statusFilter, categoryFilter, urgentOnly, isCustomer, user]);

  // Paginated List
  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page, pageSize]);

  return (
    <div>
      <PageHeader
        title={isCustomer ? 'My Service Tickets' : 'Ticket Management Hub'}
        subtitle={
          isCustomer
            ? 'Track the real-time status and resolution of your maintenance requests.'
            : 'Monitor, dispatch, and resolve active service requests across all facility zones.'
        }
        breadcrumbs={
          isAdminOrDispatcher
            ? [{ label: 'Operations', href: '/dashboard' }, { label: 'Tickets' }]
            : [{ label: 'Tickets' }]
        }
        actions={
          <div className="d-flex gap-2">
            {isAdminOrDispatcher && (
              <Button
                variant="secondary"
                icon="update"
                onClick={handleProcessExpired}
                loading={processingExpired}
              >
                Process Expired Offers
              </Button>
            )}
            {user?.role !== 'TECHNICIAN' && (
              <Link to="/tickets/new" className="btn-sh-primary text-decoration-none">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  add
                </span>
                <span>+ New Ticket</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Advanced Filter Bar (Matches Stitch ba2e6d03...) */}
      <div className="sh-card bg-white p-3 mb-4 border border-outline-variant">
        <div className="row g-2 align-items-center">
          {/* Search */}
          <div className="col-12 col-md-4">
            <div className="position-relative">
              <span
                className="material-symbols-outlined position-absolute text-secondary"
                style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}
              >
                search
              </span>
              <input
                type="text"
                className="form-control form-control-sm ps-4"
                placeholder="Search by Title, ID, Customer..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING (Created)</option>
              <option value="ROUTING">ROUTING (Offered)</option>
              <option value="ASSIGNED">ASSIGNED (Accepted)</option>
              <option value="ARRIVED">ARRIVED (On Site)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Working)</option>
              <option value="AWAITING_CUSTOMER_CONFIRMATION">AWAITING CONFIRMATION</option>
              <option value="CLOSED">CLOSED (Resolved)</option>
              <option value="REOPENED">REOPENED (Rerouting)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Priority Toggle */}
          <div className="col-12 col-md-2 d-flex align-items-center justify-content-md-end">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="urgentOnlyCheck"
                checked={urgentOnly}
                onChange={(e) => {
                  setUrgentOnly(e.target.checked);
                  setPage(1);
                }}
              />
              <label className="form-check-label small fw-semibold text-danger" htmlFor="urgentOnlyCheck">
                Urgent Only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <SkeletonLoader type="table" count={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon="confirmation_number"
          title="No Tickets Found"
          description={
            searchTerm || statusFilter || categoryFilter || urgentOnly
              ? 'No service tickets match your filter criteria. Try clearing search filters.'
              : 'No service requests have been submitted yet.'
          }
          actionLabel="Create Service Request"
          onAction={() => navigate('/tickets/new')}
        />
      ) : (
        <div className="sh-card bg-white border border-outline-variant mb-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-surface-container-low border-bottom border-outline-variant font-label text-secondary" style={{ fontSize: '11px' }}>
                <tr>
                  <th scope="col" className="ps-3" style={{ width: '100px' }}>ID</th>
                  <th scope="col">Summary & Title</th>
                  <th scope="col">Category</th>
                  <th scope="col">Customer / Unit</th>
                  <th scope="col">Schedule</th>
                  <th scope="col">Status</th>
                  <th scope="col">Specialist</th>
                  <th scope="col" className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body small" style={{ fontSize: '13px' }}>
                {paginatedTickets.map((ticket) => {
                  const shortId = ticket.id ? ticket.id.slice(0, 8).toUpperCase() : '---';
                  const isScheduled = Boolean(ticket.scheduled_for);

                  return (
                    <tr
                      key={ticket.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <td className="ps-3 font-mono text-secondary fw-semibold">
                        #{shortId}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold text-on-surface text-truncate" style={{ maxWidth: '280px' }}>
                            {ticket.description}
                          </span>
                          {ticket.is_urgent && (
                            <span className="badge bg-danger text-white font-label" style={{ fontSize: '9px' }}>
                              URGENT
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-surface-container text-on-surface border border-outline-variant font-label" style={{ fontSize: '11px' }}>
                          {ticket.category?.name || ticket.service_category?.name || 'General'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-on-surface">
                          {ticket.customer?.full_name || 'Resident'}
                        </div>
                        <div className="text-secondary" style={{ fontSize: '11px' }}>
                          {ticket.customer?.default_location || 'Tower A'}
                        </div>
                      </td>
                      <td>
                        {isScheduled ? (
                          <div className="d-flex align-items-center gap-1 text-primary">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              schedule
                            </span>
                            <span style={{ fontSize: '11px' }}>
                              {new Date(ticket.scheduled_for).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning-emphasis font-label" style={{ fontSize: '10px' }}>
                            ⚡ ASAP
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td>
                        {ticket.assigned_technician ? (
                          <div className="d-flex align-items-center gap-1">
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                              style={{ width: '22px', height: '22px', fontSize: '10px' }}
                            >
                              {ticket.assigned_technician.name?.slice(0, 1) || 'T'}
                            </div>
                            <span className="fw-semibold text-on-surface" style={{ fontSize: '12px' }}>
                              {ticket.assigned_technician.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-secondary small font-mono">—</span>
                        )}
                      </td>
                      <td className="text-end pe-3" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex justify-content-end gap-1">
                          <Link
                            to={`/tickets/${ticket.id}`}
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            style={{ fontSize: '11px' }}
                          >
                            View
                          </Link>
                          {ticket.status === 'PENDING' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-0 px-2"
                              style={{ fontSize: '11px' }}
                              onClick={(e) => handleCancelTicket(e, ticket.id)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 bg-surface-container-low border-top border-outline-variant d-flex justify-content-between align-items-center font-label text-secondary" style={{ fontSize: '11px' }}>
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredTickets.length)} of {filteredTickets.length} tickets
            </span>
            <div className="d-flex gap-2 align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="font-mono fw-bold text-on-surface">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
