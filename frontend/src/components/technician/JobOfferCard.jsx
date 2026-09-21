import React, { useState } from 'react';
import ActiveOfferTimer from '../routing/ActiveOfferTimer';
import Button from '../common/Button';
import DeclineOfferModal from './DeclineOfferModal';

export default function JobOfferCard({
  ticket,
  assignment,
  onAccept,
  onAskLater,
  onDecline,
  loading = false,
}) {
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null); // 'accept' | 'ask-later' | 'decline'

  if (!ticket || !assignment) return null;

  const shortId = ticket.id.slice(0, 8).toUpperCase();
  const isDeferred = assignment.status === 'DEFERRED';
  const summaryTitle = ticket.description
    ? ticket.description.length > 60
      ? ticket.description.slice(0, 60) + '...'
      : ticket.description
    : ticket.title || 'Service Request';

  const categoryName = ticket.category?.name || ticket.service_category?.name || 'General';
  const locationText = ticket.location || ticket.customer?.default_location || 'Tower A';
  const timingText = ticket.is_scheduled
    ? ticket.scheduled_for
      ? `Scheduled (${new Date(ticket.scheduled_for).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })})`
      : 'Scheduled'
    : 'Immediate (ASAP)';

  async function handleAccept() {
    try {
      setActionInProgress('accept');
      await onAccept(assignment.id);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleAskLater() {
    try {
      setActionInProgress('ask-later');
      await onAskLater(assignment.id);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleConfirmDecline(declineData) {
    try {
      setActionInProgress('decline');
      await onDecline(assignment.id, declineData);
      setShowDeclineModal(false);
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <>
      <section
        className={`sh-card bg-white rounded-3 shadow-sm overflow-hidden mb-4 border ${
          ticket.is_urgent ? 'border-danger' : 'border-primary'
        }`}
        style={{ borderLeft: `6px solid ${ticket.is_urgent ? 'var(--color-error)' : 'var(--color-primary)'}` }}
      >
        {/* Top Urgency Header */}
        <div className="p-3 p-md-4 bg-surface-container-lowest border-bottom border-outline-variant d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge font-label py-1 px-2 ${
                ticket.is_urgent ? 'bg-danger text-white' : 'bg-primary text-white'
              }`}
              style={{ fontSize: '11px' }}
            >
              {ticket.is_urgent ? '⚡ URGENT OFFER' : '⚡ NEW JOB OFFER'}
            </span>
            {isDeferred && (
              <span className="badge bg-warning-subtle text-warning-emphasis font-label" style={{ fontSize: '11px' }}>
                DEFERRED (ASK ME LATER)
              </span>
            )}
            <span className="font-mono text-secondary small">#TK-{shortId}</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="font-label text-secondary small text-uppercase">Time to Respond:</span>
            <ActiveOfferTimer
              offeredAt={assignment.assigned_at || ticket.updated_at}
              expiresAt={assignment.expires_at}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3 p-md-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-8">
              <h3 className="font-headline h5 text-on-surface fw-bold mb-2">
                {summaryTitle}
              </h3>
              <p className="text-secondary small mb-3" style={{ lineHeight: '1.6' }}>
                {ticket.description}
              </p>

              {/* Bento Attributes Row */}
              <div className="row g-2">
                <div className="col-6 col-sm-4">
                  <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant">
                    <span className="font-label text-secondary d-block" style={{ fontSize: '10px' }}>
                      SERVICE CATEGORY
                    </span>
                    <span className="fw-semibold text-on-surface small d-flex align-items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>
                        build
                      </span>
                      <span>{categoryName}</span>
                    </span>
                  </div>
                </div>

                <div className="col-6 col-sm-4">
                  <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant">
                    <span className="font-label text-secondary d-block" style={{ fontSize: '10px' }}>
                      LOCATION
                    </span>
                    <span className="fw-semibold text-on-surface small d-flex align-items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>
                        location_on
                      </span>
                      <span>{locationText}</span>
                    </span>
                  </div>
                </div>

                <div className="col-12 col-sm-4">
                  <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant">
                    <span className="font-label text-secondary d-block" style={{ fontSize: '10px' }}>
                      TIMING PREFERENCE
                    </span>
                    <span className="fw-semibold text-on-surface small d-flex align-items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>
                        schedule
                      </span>
                      <span>{timingText}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="col-12 col-lg-4">
              <div className="vstack gap-2">
                <Button
                  variant="success"
                  className="w-100 py-2 justify-content-center fw-bold shadow-sm"
                  onClick={handleAccept}
                  loading={actionInProgress === 'accept' || loading}
                  icon="check_circle"
                >
                  Accept Job
                </Button>

                <div className="d-flex gap-2">
                  {!isDeferred && (
                    <Button
                      variant="secondary"
                      className="flex-fill justify-content-center small"
                      onClick={handleAskLater}
                      loading={actionInProgress === 'ask-later' || loading}
                      icon="schedule"
                    >
                      Ask Later
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    className="flex-fill justify-content-center small"
                    onClick={() => setShowDeclineModal(true)}
                    loading={actionInProgress === 'decline' || loading}
                    icon="cancel"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decline Confirmation Dialog */}
      <DeclineOfferModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onConfirm={handleConfirmDecline}
        loading={actionInProgress === 'decline'}
        ticketTitle={summaryTitle}
      />
    </>
  );
}
