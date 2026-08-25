import React from 'react';

export default function AssignmentHistoryTimeline({ assignments = [] }) {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="sh-card bg-white p-4 rounded-3 border border-outline-variant text-center text-secondary small">
        No assignment attempts recorded yet.
      </div>
    );
  }

  return (
    <div className="sh-card bg-white p-3 p-md-4 rounded-3 border border-outline-variant mb-4">
      <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom border-outline-variant">
        <div className="d-flex align-items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
            history
          </span>
          <h3 className="font-headline h6 text-on-surface fw-bold mb-0">
            Assignment & Dispatch Attempts Timeline ({assignments.length})
          </h3>
        </div>
      </div>

      <div className="position-relative ps-3">
        {/* Timeline connector bar */}
        <div
          className="position-absolute bg-outline-variant"
          style={{ top: '10px', bottom: '10px', left: '19px', width: '2px' }}
        ></div>

        <div className="vstack gap-3">
          {assignments.map((att, idx) => {
            const isLatest = idx === assignments.length - 1;
            const assignedTime = new Date(att.assigned_at || att.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            let badgeClass = 'bg-secondary text-white';
            let icon = 'schedule';
            if (att.status === 'ACCEPTED') {
              badgeClass = 'bg-success text-white';
              icon = 'check_circle';
            } else if (att.status === 'DECLINED') {
              badgeClass = 'bg-danger text-white';
              icon = 'cancel';
            } else if (att.status === 'DEFERRED') {
              badgeClass = 'bg-warning text-dark';
              icon = 'snooze';
            } else if (att.status === 'EXPIRED') {
              badgeClass = 'bg-danger-subtle text-danger border border-danger';
              icon = 'timer_off';
            } else if (att.status === 'COMPLETED') {
              badgeClass = 'bg-info text-white';
              icon = 'task_alt';
            }

            return (
              <div key={att.id || idx} className="d-flex gap-3 position-relative">
                {/* Status Dot */}
                <div
                  className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${badgeClass}`}
                  style={{ width: '28px', height: '28px', zIndex: 2, fontSize: '13px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {icon}
                  </span>
                </div>

                {/* Card Content */}
                <div className="flex-grow-1 p-3 bg-surface-container-lowest rounded-3 border border-outline-variant">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-on-surface" style={{ fontSize: '13px' }}>
                        Attempt #{idx + 1}: {att.technician?.full_name || 'Specialist'}
                      </span>
                      <span className={`badge font-label ${badgeClass}`} style={{ fontSize: '10px' }}>
                        {att.status}
                      </span>
                    </div>

                    <span className="font-mono text-secondary small" style={{ fontSize: '11px' }}>
                      {assignedTime}
                    </span>
                  </div>

                  {att.decline_reason && (
                    <div className="mt-2 p-2 bg-danger-subtle text-danger-emphasis rounded small font-body">
                      <strong>Decline Reason:</strong> {att.decline_reason}
                      {att.decline_note && ` — "${att.decline_note}"`}
                    </div>
                  )}

                  {att.deferred_at && (
                    <div className="mt-1 small text-secondary font-mono">
                      Deferred decision at: {new Date(att.deferred_at).toLocaleTimeString()}
                    </div>
                  )}

                  {att.responded_at && (
                    <div className="mt-1 small text-secondary font-mono">
                      Responded at: {new Date(att.responded_at).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
