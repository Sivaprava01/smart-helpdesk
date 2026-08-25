import React, { useState } from 'react';
import { ticketsApi } from '../../api/tickets';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';

export default function ServiceResolutionCard({
  ticket,
  onResolved = null,
  customerId = null,
}) {
  const { showSuccess, showError } = useToast();

  const [decision, setDecision] = useState(null); // 'YES' | 'NO' | null
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!ticket) return null;

  const isAwaitingConfirmation = ticket.status === 'AWAITING_CUSTOMER_CONFIRMATION';
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  // If already resolved and not awaiting confirmation, do not render submission form
  if (!isAwaitingConfirmation && isResolved) return null;

  async function handleSubmitResponse(e) {
    e.preventDefault();
    if (!decision) return;

    try {
      setSubmitting(true);
      const isYes = decision === 'YES';

      const payload = {
        was_issue_resolved: isYes,
        rating: isYes ? Number(rating) : undefined,
        comment: comment.trim() || undefined,
      };

      const res = await ticketsApi.submitCustomerResponse(ticket.id, payload, customerId);

      if (isYes) {
        showSuccess('Thank you! Resolution confirmed and technician rating submitted.');
      } else {
        const fallbackMsg = res?.fallback?.status === 'NEW_TECHNICIAN_OFFERED'
          ? `Ticket reopened. An alternative specialist (${res.fallback.technician_name || 'candidate'}) was immediately assigned.`
          : 'Ticket reopened and returned to routing queue.';
        showSuccess(fallbackMsg);
      }

      if (onResolved) onResolved(res);
    } catch (err) {
      showError(err.message || 'Failed to submit resolution response.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="sh-card bg-white rounded-3 shadow-sm border border-outline-variant overflow-hidden mb-4">
      {/* Header */}
      <div className="bg-surface-container-low px-4 py-3 border-bottom border-outline-variant d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <span className="material-symbols-outlined text-primary fill-1" style={{ fontSize: '22px' }}>
            verified
          </span>
          <h3 className="font-headline h6 text-on-surface fw-bold mb-0">
            Resident Service Resolution Verification
          </h3>
        </div>
        <span className="badge bg-warning-subtle text-warning-emphasis font-label" style={{ fontSize: '11px' }}>
          ACTION REQUIRED
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="text-center mb-4">
          <h4 className="font-headline h5 text-on-surface fw-bold mb-2">
            Was your service issue successfully resolved?
          </h4>
          <p className="text-secondary small mb-0" style={{ maxWidth: '520px', margin: '0 auto' }}>
            Technician {ticket.technician?.full_name || 'Specialist'} has marked this service work complete. Please confirm whether the maintenance problem has been fully fixed.
          </p>
        </div>

        {/* Decision Toggle Buttons (Matches Stitch 09a70151...) */}
        <div className="row g-3 justify-content-center mb-4">
          <div className="col-12 col-sm-6 col-md-5">
            <button
              type="button"
              className={`btn w-100 p-3 rounded-3 d-flex flex-column align-items-center justify-content-center border-2 transition-all ${
                decision === 'YES'
                  ? 'btn-primary border-primary shadow-sm'
                  : 'btn-outline-secondary text-on-surface border-outline-variant hover-bg'
              }`}
              onClick={() => setDecision('YES')}
            >
              <span className="material-symbols-outlined mb-1" style={{ fontSize: '28px' }}>
                thumb_up
              </span>
              <span className="fw-bold">Yes, Issue Resolved</span>
              <span className="small opacity-75 mt-1" style={{ fontSize: '11px' }}>
                Fix confirmed • Rate service quality
              </span>
            </button>
          </div>

          <div className="col-12 col-sm-6 col-md-5">
            <button
              type="button"
              className={`btn w-100 p-3 rounded-3 d-flex flex-column align-items-center justify-content-center border-2 transition-all ${
                decision === 'NO'
                  ? 'btn-danger border-danger shadow-sm'
                  : 'btn-outline-secondary text-on-surface border-outline-variant hover-bg'
              }`}
              onClick={() => setDecision('NO')}
            >
              <span className="material-symbols-outlined mb-1" style={{ fontSize: '28px' }}>
                thumb_down
              </span>
              <span className="fw-bold">No, Problem Persists</span>
              <span className="small opacity-75 mt-1" style={{ fontSize: '11px' }}>
                Reopen ticket • Request alternate tech
              </span>
            </button>
          </div>
        </div>

        {/* YES: Star Rating & Feedback Form */}
        {decision === 'YES' && (
          <form onSubmit={handleSubmitResponse} className="border-top border-outline-variant pt-3 animate-fade-in">
            <div className="text-center mb-3">
              <label className="form-label font-label text-secondary small d-block mb-1">
                RATE TECHNICIAN PERFORMANCE
              </label>
              <div className="d-inline-flex gap-1 py-1 px-3 bg-surface-container-low rounded-pill border border-outline-variant">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className="btn btn-link text-decoration-none p-1 border-0"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <span
                        className={`material-symbols-outlined ${
                          isFilled ? 'text-warning fill-1' : 'text-secondary'
                        }`}
                        style={{ fontSize: '28px', transition: 'transform 0.1s' }}
                      >
                        star
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="font-label text-primary small fw-semibold mt-1">
                {rating === 5 && 'Outstanding Service (5/5)'}
                {rating === 4 && 'Very Good (4/5)'}
                {rating === 3 && 'Average (3/5)'}
                {rating === 2 && 'Below Expectations (2/5)'}
                {rating === 1 && 'Unsatisfactory (1/5)'}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label font-label text-secondary" htmlFor="positiveFeedback">
                Comments or Praise (Optional)
              </label>
              <textarea
                id="positiveFeedback"
                className="form-control"
                rows="3"
                placeholder="Tell us how the technician handled the repair..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2 justify-content-center fw-bold"
              loading={submitting}
              icon="send"
            >
              Confirm Resolution & Submit Feedback
            </Button>
          </form>
        )}

        {/* NO: Reopen Reason & Fallback Form */}
        {decision === 'NO' && (
          <form onSubmit={handleSubmitResponse} className="border-top border-outline-variant pt-3 animate-fade-in">
            <div className="alert alert-danger p-3 small mb-3">
              <strong>Ticket Reopening:</strong> Submitting this response will mark the maintenance attempt as unresolved, increment the specialist's reopen count, and immediately trigger automated fallback routing to assign an alternative technician.
            </div>

            <div className="mb-3">
              <label className="form-label font-label text-danger fw-semibold" htmlFor="reopenReason">
                What is still wrong or unfinished? <span className="text-danger">*</span>
              </label>
              <textarea
                id="reopenReason"
                className="form-control border-danger"
                rows="3"
                placeholder="Please provide specifics on what remains broken or leaking..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                maxLength={1000}
              />
            </div>

            <Button
              type="submit"
              variant="danger"
              className="w-100 py-2 justify-content-center fw-bold"
              loading={submitting}
              icon="refresh"
            >
              Reopen Ticket & Dispatch Alternate Specialist
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
