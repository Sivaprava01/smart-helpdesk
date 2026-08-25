import React from 'react';

export default function TicketLifecycleStepper({ status }) {
  const steps = [
    { key: 'PENDING', label: '1. Created', icon: 'receipt_long' },
    { key: 'ROUTING', label: '2. In Routing', icon: 'autorenew' },
    { key: 'ASSIGNED', label: '3. Assigned', icon: 'assignment_ind' },
    { key: 'ARRIVED', label: '4. Arrived', icon: 'location_on' },
    { key: 'IN_PROGRESS', label: '5. In Progress', icon: 'build' },
    { key: 'AWAITING_CUSTOMER_CONFIRMATION', label: '6. Verification', icon: 'rate_review' },
    { key: 'CLOSED', label: '7. Closed', icon: 'verified' },
  ];

  const statusOrder = {
    PENDING: 0,
    ROUTING: 1,
    ASSIGNED: 2,
    ARRIVED: 3,
    IN_PROGRESS: 4,
    AWAITING_CUSTOMER_CONFIRMATION: 5,
    RESOLVED: 5,
    CLOSED: 6,
    REOPENED: 1, // Branch rerouting
    CANCELLED: -1,
  };

  const currentIndex = statusOrder[status] ?? 0;
  const isReopened = status === 'REOPENED';
  const isCancelled = status === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="sh-card bg-surface-container-low border border-outline-variant p-3 d-flex align-items-center gap-3">
        <span className="material-symbols-outlined text-secondary" style={{ fontSize: '24px' }}>
          cancel
        </span>
        <div>
          <div className="fw-bold font-headline text-secondary">Ticket Cancelled</div>
          <div className="small text-secondary">This service request was cancelled prior to dispatch.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sh-card bg-white border border-outline-variant p-3">
      {/* Reopened Banner if active */}
      {isReopened && (
        <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center gap-2 small">
          <span className="material-symbols-outlined text-danger" style={{ fontSize: '18px' }}>
            replay
          </span>
          <div>
            <strong>Issue Unresolved (Reopened):</strong> Customer confirmed issue was not fixed. Automated fallback rerouting is dispatching to alternative technicians.
          </div>
        </div>
      )}

      {/* Stepper Horizontal Scroll Container */}
      <div className="d-flex align-items-center justify-content-between overflow-x-auto py-2">
        {steps.map((step, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex && !isReopened;
          const isFuture = idx > currentIndex;

          let circleClass = 'bg-surface-container-high text-secondary border-outline-variant';
          if (isPassed) circleClass = 'bg-success text-white border-success';
          if (isCurrent) circleClass = 'bg-primary text-white border-primary shadow-sm';
          if (isReopened && idx === 1) circleClass = 'bg-danger text-white border-danger';

          return (
            <React.Fragment key={step.key}>
              <div className="d-flex flex-column align-items-center text-center px-1" style={{ minWidth: '85px' }}>
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center border mb-1 ${circleClass}`}
                  style={{ width: '32px', height: '32px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {isPassed ? 'check' : step.icon}
                  </span>
                </div>
                <div
                  className={`font-label ${
                    isCurrent || (isReopened && idx === 1)
                      ? 'text-primary fw-bold'
                      : isPassed
                      ? 'text-on-surface fw-semibold'
                      : 'text-secondary'
                  }`}
                  style={{ fontSize: '10px', lineHeight: '1.2' }}
                >
                  {isReopened && idx === 1 ? 'Rerouting' : step.label}
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className="flex-grow-1 border-top"
                  style={{
                    height: '2px',
                    borderColor: isPassed ? 'var(--color-status-closed-text)' : 'var(--color-outline-variant)',
                    margin: '0 4px',
                    minWidth: '20px',
                    marginBottom: '16px',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
