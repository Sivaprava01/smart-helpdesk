import React from 'react';

export default function FeedbackHistoryCard({ feedbacks = [] }) {
  if (!feedbacks || feedbacks.length === 0) return null;

  return (
    <div className="sh-card bg-white p-3 p-md-4 rounded-3 border border-outline-variant mb-4">
      <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom border-outline-variant">
        <div className="d-flex align-items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
            rate_review
          </span>
          <h3 className="font-headline h6 text-on-surface fw-bold mb-0">
            Resident Feedback & Verification History ({feedbacks.length})
          </h3>
        </div>
      </div>

      <div className="vstack gap-3">
        {feedbacks.map((fb, idx) => {
          const isResolved = fb.was_issue_resolved;
          const formattedDate = new Date(fb.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={fb.id || idx}
              className={`p-3 rounded-3 border ${
                isResolved
                  ? 'bg-success-subtle border-success-subtle text-success-emphasis'
                  : 'bg-danger-subtle border-danger-subtle text-danger-emphasis'
              }`}
            >
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className={`badge font-label ${
                      isResolved ? 'bg-success text-white' : 'bg-danger text-white'
                    }`}
                    style={{ fontSize: '11px' }}
                  >
                    {isResolved ? '✓ ISSUE RESOLVED' : '✕ UNRESOLVED (REOPENED)'}
                  </span>
                  {fb.rating && (
                    <span className="badge bg-warning text-dark font-label d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                      <span>{fb.rating}</span>
                      <span className="material-symbols-outlined fill-1" style={{ fontSize: '12px' }}>
                        star
                      </span>
                    </span>
                  )}
                </div>

                <span className="font-mono small opacity-75" style={{ fontSize: '11px' }}>
                  {formattedDate}
                </span>
              </div>

              {fb.comment ? (
                <div className="small font-body mt-1" style={{ lineHeight: '1.5' }}>
                  "{fb.comment}"
                </div>
              ) : (
                <div className="small font-body fst-italic opacity-75 mt-1">
                  No additional comments provided.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
