import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { ticketsApi } from '../../api/tickets';
import { categoriesApi } from '../../api/categories';
import { customersApi } from '../../api/customers';
import { assignmentsApi } from '../../api/assignments';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [scheduleType, setScheduleType] = useState('ASAP'); // 'ASAP' or 'SCHEDULED'
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [autoDispatch, setAutoDispatch] = useState(true);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [cats, custs] = await Promise.all([
          categoriesApi.list({ is_active: true }),
          customersApi.list(),
        ]);
        setCategories(cats);
        setCustomers(custs);

        // Auto-select logged-in resident customer if available
        if (user?.customer_id) {
          setSelectedCustomerId(user.customer_id);
        } else if (custs.length > 0) {
          setSelectedCustomerId(custs[0].id);
        }

        if (cats.length > 0) {
          setSelectedCategoryId(cats[0].id);
        }
      } catch (err) {
        showError(err.message || 'Failed to load categories or customers.');
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, [user, showError]);

  function getCategoryIcon(name) {
    const n = name.toLowerCase();
    if (n.includes('plumb')) return 'water_drop';
    if (n.includes('elect')) return 'bolt';
    if (n.includes('hvac') || n.includes('ac')) return 'ac_unit';
    if (n.includes('carpen')) return 'handyman';
    if (n.includes('clean')) return 'cleaning_services';
    if (n.includes('paint')) return 'format_paint';
    if (n.includes('appliance')) return 'kitchen';
    return 'build';
  }

  function validate() {
    const errs = {};
    if (!selectedCustomerId) errs.customer = 'Please select or enter customer details.';
    if (!selectedCategoryId) errs.category = 'Please choose a service category.';
    if (!title.trim()) errs.title = 'Title or brief summary is required.';
    if (!description.trim()) errs.description = 'Please provide a description of the issue.';

    if (scheduleType === 'SCHEDULED') {
      if (!scheduledDateTime) {
        errs.scheduled = 'Please select a future date and time.';
      } else {
        const scheduledTime = new Date(scheduledDateTime);
        if (scheduledTime <= new Date()) {
          errs.scheduled = 'Scheduled service time must be in the future.';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        customer_id: selectedCustomerId,
        service_category_id: selectedCategoryId,
        title: title.trim(),
        description: description.trim(),
        is_urgent: isUrgent,
        scheduled_for:
          scheduleType === 'SCHEDULED' && scheduledDateTime
            ? new Date(scheduledDateTime).toISOString()
            : null,
      };

      const newTicket = await ticketsApi.create(payload);

      // Auto-dispatch assignment offer if selected and ticket is ASAP
      if (autoDispatch && scheduleType === 'ASAP') {
        try {
          await assignmentsApi.startAssignment(newTicket.id);
          showSuccess('Ticket created and assignment offer dispatched to top-ranked specialist.');
        } catch (dispatchErr) {
          console.warn('Auto-dispatch notice:', dispatchErr.message);
          showSuccess('Ticket created successfully (ready for manual dispatch).');
        }
      } else {
        showSuccess('Ticket created successfully.');
      }

      navigate(`/tickets/${newTicket.id}`);
    } catch (err) {
      showError(err.message || 'Failed to submit service request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <PageHeader
        title="Create Service Request"
        subtitle="Submit maintenance ticket for automated technician routing and dispatch."
        breadcrumbs={[
          { label: 'Operations', href: '/dashboard' },
          { label: 'Tickets', href: '/tickets' },
          { label: 'New Request' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left Column: Customer & Location */}
          <div className="col-12 col-lg-7">
            {/* Customer Details Card */}
            <div className="sh-card bg-white p-4 mb-4 border border-outline-variant">
              <h3 className="font-headline h6 text-on-surface mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <span className="material-symbols-outlined text-primary">person</span>
                <span>Customer & Contact Information</span>
              </h3>

              {user?.role === 'CUSTOMER' && user?.customer_id ? (
                <div className="p-3 bg-surface-container-low rounded-2 border border-outline-variant mb-2">
                  <div className="fw-semibold text-on-surface small">Submitted for Your Profile:</div>
                  <div className="text-secondary small font-mono">{user.email}</div>
                </div>
              ) : (
                <div className="mb-3">
                  <label className="form-label font-label text-secondary mb-1">
                    Select Resident / Customer <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.customer ? 'is-invalid' : ''}`}
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    disabled={loadingInitial}
                  >
                    <option value="">Select resident from directory...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} — {c.phone_number} ({c.default_location || 'Tower A'})
                      </option>
                    ))}
                  </select>
                  {errors.customer && <div className="invalid-feedback">{errors.customer}</div>}
                  <div className="text-secondary small mt-1" style={{ fontSize: '11px' }}>
                    Need a new resident? <Link to="/customers" className="text-primary text-decoration-none">Add in resident directory</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Service Category Selection (Matches Stitch 8b367a16...) */}
            <div className="sh-card bg-white p-4 mb-4 border border-outline-variant">
              <h3 className="font-headline h6 text-on-surface mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <span className="material-symbols-outlined text-primary">category</span>
                <span>Service Category & Skill Domain <span className="text-danger">*</span></span>
              </h3>

              {errors.category && <div className="text-danger small mb-2">{errors.category}</div>}

              <div className="row g-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const icon = getCategoryIcon(cat.name);
                  return (
                    <div key={cat.id} className="col-6 col-sm-4">
                      <div
                        className={`p-3 rounded-2 border text-center cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary-subtle text-primary fw-bold shadow-sm'
                            : 'border-outline-variant bg-white text-on-surface hover-lift'
                        }`}
                        onClick={() => setSelectedCategoryId(cat.id)}
                      >
                        <span className="material-symbols-outlined d-block mb-1" style={{ fontSize: '28px' }}>
                          {icon}
                        </span>
                        <span className="font-headline small" style={{ fontSize: '12px' }}>
                          {cat.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Request Summary & Description */}
            <div className="sh-card bg-white p-4 border border-outline-variant">
              <h3 className="font-headline h6 text-on-surface mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <span className="material-symbols-outlined text-primary">description</span>
                <span>Issue Summary & Description</span>
              </h3>

              <div className="mb-3">
                <label className="form-label font-label text-secondary mb-1">
                  Brief Title / Issue Summary <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                  placeholder="e.g. Water leak under master bathroom sink"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label font-label text-secondary mb-1">
                  Detailed Problem Description <span className="text-danger">*</span>
                </label>
                <textarea
                  rows="4"
                  className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                  placeholder="Describe the issue symptoms, affected rooms, or any immediate safety hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
                {errors.description && <div className="invalid-feedback">{errors.description}</div>}
              </div>

              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="urgentSwitch"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                />
                <label className="form-check-label fw-semibold text-danger" htmlFor="urgentSwitch">
                  Mark as High Priority / Urgent Issue
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Scheduling & Submission */}
          <div className="col-12 col-lg-5">
            {/* Scheduling Card */}
            <div className="sh-card bg-white p-4 mb-4 border border-outline-variant">
              <h3 className="font-headline h6 text-on-surface mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <span>Scheduling Options</span>
              </h3>

              {/* Toggle Pills */}
              <div className="btn-group w-100 mb-3" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${
                    scheduleType === 'ASAP' ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setScheduleType('ASAP')}
                >
                  ⚡ ASAP (Immediate)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    scheduleType === 'SCHEDULED' ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setScheduleType('SCHEDULED')}
                >
                  📅 Future Date & Time
                </button>
              </div>

              {scheduleType === 'SCHEDULED' ? (
                <div className="mb-3">
                  <label className="form-label font-label text-secondary mb-1">
                    Scheduled Date & Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className={`form-control ${errors.scheduled ? 'is-invalid' : ''}`}
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                  />
                  {errors.scheduled && <div className="invalid-feedback">{errors.scheduled}</div>}
                  <div className="form-text small" style={{ fontSize: '11px' }}>
                    Technician routing evaluates availability for the chosen window.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-surface-container-low rounded-2 border border-outline-variant small mb-3 text-secondary">
                  <div className="fw-semibold text-on-surface mb-1">Immediate Dispatch:</div>
                  The routing engine will score on-duty technicians and send an assignment offer with a 15-minute response window immediately.
                </div>
              )}

              {/* Auto Dispatch Checkbox */}
              {scheduleType === 'ASAP' && (
                <div className="form-check mt-3 pt-2 border-top">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoDispatchCheck"
                    checked={autoDispatch}
                    onChange={(e) => setAutoDispatch(e.target.checked)}
                  />
                  <label className="form-check-label text-on-surface small fw-semibold" htmlFor="autoDispatchCheck">
                    Automatically trigger assignment dispatch upon submission
                  </label>
                </div>
              )}
            </div>

            {/* Submission Actions Card */}
            <div className="sh-card bg-surface-container-low p-4 border border-outline-variant">
              <Button
                type="submit"
                variant="primary"
                className="w-100 py-2 justify-content-center mb-2"
                loading={submitting}
              >
                <span>Submit Service Request</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  send
                </span>
              </Button>

              <button
                type="button"
                className="btn btn-sm btn-link text-secondary w-100 text-decoration-none"
                onClick={() => navigate('/tickets')}
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
