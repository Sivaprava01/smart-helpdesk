import React, { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function ActiveJobExecutionCard({
  ticket,
  onArrive,
  onStartWork,
  onCompleteWork,
  loading = false,
}) {
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null); // 'arrive' | 'start' | 'complete'

  if (!ticket) return null;

  const shortId = ticket.id.slice(0, 8).toUpperCase();
  const status = ticket.status; // 'ASSIGNED' | 'ARRIVED' | 'IN_PROGRESS' | 'AWAITING_CUSTOMER_CONFIRMATION' | 'RESOLVED'

  // Step indices
  const steps = [
    { label: 'Dispatched', icon: 'check_circle', key: 'ASSIGNED' },
    { label: 'Arrived', icon: 'directions_car', key: 'ARRIVED' },
    { label: 'Working', icon: 'build', key: 'IN_PROGRESS' },
    { label: 'Completed', icon: 'task_alt', key: 'AWAITING_CUSTOMER_CONFIRMATION' },
  ];

  function getStepIndex(currentStatus) {
    if (currentStatus === 'ASSIGNED') return 0;
    if (currentStatus === 'ARRIVED') return 1;
    if (currentStatus === 'IN_PROGRESS') return 2;
    if (currentStatus === 'AWAITING_CUSTOMER_CONFIRMATION' || currentStatus === 'RESOLVED' || currentStatus === 'CLOSED') return 3;
    return 0;
  }

  const activeStepIdx = getStepIndex(status);

  async function handleArrive() {
    try {
      setActionInProgress('arrive');
      await onArrive(ticket.id);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleStartWork() {
    try {
      setActionInProgress('start');
      await onStartWork(ticket.id);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleConfirmComplete(e) {
    e.preventDefault();
    try {
      setActionInProgress('complete');
      await onCompleteWork(ticket.id, { completion_notes: completionNotes.trim() || undefined });
      setShowCompleteModal(false);
      setCompletionNotes('');
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <>
      <section className="sh-card bg-white rounded-3 shadow-sm overflow-hidden mb-4 border border-outline-variant">
        {/* Header Bar */}
        <div className="bg-surface-container-low px-3 py-2 border-bottom border-outline-variant d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary text-white font-label" style={{ fontSize: '10px' }}>
              CURRENT EXECUTION
            </span>
            <span className="font-headline fw-bold text-on-surface small">
              {ticket.service_category?.name || 'Service'} Job
            </span>
          </div>
          <span className="font-mono text-primary fw-bold small">#TK-{shortId}</span>
        </div>

        {/* Execution Card Body */}
        <div className="p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h3 className="font-headline h5 text-on-surface fw-bold mb-1">{ticket.title}</h3>
              <p className="text-secondary small mb-0 font-mono">
                Location: {ticket.customer?.default_location || 'Tower A'} • Resident: {ticket.customer?.full_name || 'Resident'}
              </p>
            </div>
          </div>

          {/* Sequential Stepper (Matches Stitch ee416550...) */}
          <div className="py-3 px-2 my-2 bg-surface-container-lowest rounded-3 border border-outline-variant">
            <div className="d-flex justify-content-between position-relative">
              {/* Connector line */}
              <div
                className="position-absolute top-50 start-0 translate-middle-y w-100 bg-outline-variant"
                style={{ height: '3px', zIndex: 1 }}
              ></div>
              <div
                className="position-absolute top-50 start-0 translate-middle-y bg-primary transition-all duration-300"
                style={{
                  height: '3px',
                  width: `${(activeStepIdx / (steps.length - 1)) * 100}%`,
                  zIndex: 2,
                }}
              ></div>

              {steps.map((step, idx) => {
                const isPassed = idx < activeStepIdx;
                const isCurrent = idx === activeStepIdx;

                let circleClass = 'bg-surface-container text-secondary border';
                if (isPassed) circleClass = 'bg-primary text-white shadow-sm';
                if (isCurrent) circleClass = 'bg-primary-container text-primary border-primary fw-bold ring-4';

                return (
                  <div key={step.label} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 3 }}>
                    <div
                      className={`d-flex align-items-center justify-content-center rounded-circle ${circleClass}`}
                      style={{ width: '32px', height: '32px', fontSize: '14px', backgroundColor: isCurrent ? '#fff' : undefined }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {isPassed ? 'check' : step.icon}
                      </span>
                    </div>
                    <span
                      className={`font-label mt-1 small ${isCurrent ? 'fw-bold text-primary' : 'text-secondary'}`}
                      style={{ fontSize: '11px' }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Next Required Action Box */}
          <div className="p-3 bg-surface-container-low rounded-3 border border-outline-variant mt-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="font-label text-secondary small d-block">NEXT REQUIRED ACTION:</span>
              <span className="font-headline fw-bold text-on-surface" style={{ fontSize: '15px' }}>
                {status === 'ASSIGNED' && 'Mark Arrived at Customer Unit'}
                {status === 'ARRIVED' && 'Begin On-Site Service & Diagnostic'}
                {status === 'IN_PROGRESS' && 'Complete Work & Submit Completion Summary'}
                {status === 'AWAITING_CUSTOMER_CONFIRMATION' && 'Work Submitted • Awaiting Resident Confirmation'}
                {status === 'RESOLVED' && 'Job Successfully Resolved & Closed'}
              </span>
            </div>

            <div className="d-flex gap-2">
              {status === 'ASSIGNED' && (
                <Button
                  variant="primary"
                  className="px-4 py-2"
                  onClick={handleArrive}
                  loading={actionInProgress === 'arrive' || loading}
                  icon="location_on"
                >
                  I Have Arrived
                </Button>
              )}

              {status === 'ARRIVED' && (
                <Button
                  variant="primary"
                  className="px-4 py-2"
                  onClick={handleStartWork}
                  loading={actionInProgress === 'start' || loading}
                  icon="build"
                >
                  Start Work
                </Button>
              )}

              {status === 'IN_PROGRESS' && (
                <Button
                  variant="success"
                  className="px-4 py-2 fw-bold"
                  onClick={() => setShowCompleteModal(true)}
                  loading={actionInProgress === 'complete' || loading}
                  icon="task_alt"
                >
                  Complete Work
                </Button>
              )}

              {status === 'AWAITING_CUSTOMER_CONFIRMATION' && (
                <span className="badge bg-info-subtle text-info-emphasis border border-info px-3 py-2 font-label" style={{ fontSize: '12px' }}>
                  AWAITING RESIDENT CONFIRMATION
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Complete Work Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Service Work"
        size="md"
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <Button variant="secondary" onClick={() => setShowCompleteModal(false)} disabled={actionInProgress === 'complete'}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleConfirmComplete} loading={actionInProgress === 'complete'}>
              Submit & Request Resident Review
            </Button>
          </div>
        }
      >
        <form onSubmit={handleConfirmComplete}>
          <div className="alert alert-info p-3 small mb-3">
            Submitting completion will notify the customer to test the repair and provide resolution verification and star rating.
          </div>

          <div className="mb-3">
            <label className="form-label font-label text-secondary" htmlFor="completionNotes">
              Resolution Summary / Work Performed Notes
            </label>
            <textarea
              id="completionNotes"
              className="form-control"
              rows="4"
              placeholder="Describe the diagnostics, replaced components, and tests performed to verify the repair..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
