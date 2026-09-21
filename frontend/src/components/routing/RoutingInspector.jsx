import React, { useEffect, useState } from 'react';
import { routingApi } from '../../api/routing';
import { assignmentsApi } from '../../api/assignments';
import CandidateScoreBreakdown from './CandidateScoreBreakdown';
import SkeletonLoader from '../common/SkeletonLoader';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';

export default function RoutingInspector({ ticket, onDispatched = null, onClose = null }) {
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  useEffect(() => {
    if (!ticket?.id) {
      setPreviewData(null);
      return;
    }

    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);
        const data = await routingApi.previewRouting(ticket.id);
        setPreviewData(data);
        if (data?.recommended_technician) {
          setSelectedCandidateId(data.recommended_technician.technician_id);
        } else if (data?.ranked_candidates?.length > 0) {
          setSelectedCandidateId(data.ranked_candidates[0].technician_id);
        }
      } catch (err) {
        setError(err.message || 'Failed to calculate routing scores for this ticket.');
        setPreviewData(null);
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [ticket?.id]);

  async function handleDispatch() {
    if (!ticket?.id) return;

    try {
      setDispatching(true);
      await assignmentsApi.startAssignment(ticket.id);
      showSuccess(`Assignment offer dispatched to ${previewData?.recommended_technician?.technician_name || 'top specialist'}.`);
      if (onDispatched) onDispatched(ticket.id);
    } catch (err) {
      showError(err.message || 'Failed to dispatch assignment offer.');
    } finally {
      setDispatching(false);
    }
  }

  if (!ticket) {
    return (
      <div className="sh-card bg-surface-container-lowest p-4 text-center text-secondary border border-outline-variant h-100 d-flex flex-column align-items-center justify-content-center">
        <span className="material-symbols-outlined display-6 mb-2 text-secondary">
          policy
        </span>
        <div className="fw-semibold text-on-surface">No Ticket Selected</div>
        <div className="small">Select any ticket in the queue to inspect candidate scores and deterministic ranking.</div>
      </div>
    );
  }

  const shortId = ticket.id.slice(0, 8).toUpperCase();
  const selectedCandidate = previewData?.ranked_candidates?.find(
    (c) => c.technician_id === selectedCandidateId
  ) || previewData?.ranked_candidates?.[0] || null;

  const excludedList = previewData?.excluded_candidates || previewData?.excluded_technicians || [];
  const canDispatch = ticket.status === 'PENDING' || ticket.status === 'REOPENED';

  return (
    <div className="sh-card bg-white border border-outline-variant rounded-3 p-3 h-100 d-flex flex-column" style={{ borderTop: '4px solid var(--color-primary)' }}>
      {/* Inspector Header */}
      <div className="d-flex justify-content-between align-items-start mb-3 pb-2 border-bottom border-outline-variant">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
              policy
            </span>
            <span className="font-headline fw-bold text-on-surface" style={{ fontSize: '15px' }}>
              Routing Inspector
            </span>
          </div>
          <div className="text-secondary small font-mono mt-1">
            Analyzing Ticket #{shortId} ({ticket.category?.name || ticket.service_category?.name || previewData?.ticket_category || 'General'})
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="btn btn-sm btn-link text-secondary p-0"
            onClick={onClose}
            aria-label="Close Inspector"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-4">
          <SkeletonLoader type="card" count={2} />
        </div>
      ) : error ? (
        <div className="alert alert-danger p-3 small d-flex align-items-start gap-2">
          <span className="material-symbols-outlined text-danger">error</span>
          <div>
            <strong>Evaluation Error:</strong> {error}
          </div>
        </div>
      ) : !previewData ? (
        <div className="text-secondary small text-center py-4">No analysis available.</div>
      ) : (
        <div className="flex-grow-1 overflow-y-auto pr-1">
          {/* Top Recommendation Badge */}
          {previewData.recommended_technician ? (
            <div className="p-3 bg-surface-container-low rounded-2 border border-primary mb-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
                    style={{ width: '36px', height: '36px', fontSize: '13px' }}
                  >
                    #1
                  </div>
                  <div>
                    <div className="fw-bold text-on-surface">{previewData.recommended_technician.technician_name}</div>
                    <div className="text-secondary small font-mono">
                      Domain: {previewData.ticket_category || 'General'}
                    </div>
                  </div>
                </div>
                <span className="badge bg-primary text-white font-mono" style={{ fontSize: '13px' }}>
                  {(previewData.recommended_technician.total_score != null ? Number(previewData.recommended_technician.total_score) : 0).toFixed(1)} / 100
                </span>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning p-2 small mb-3">
              No eligible on-duty specialists match this ticket's category and capacity constraints.
            </div>
          )}

          {/* 5-Factor Score Breakdown */}
          {selectedCandidate && (
            <div className="mb-3">
              <CandidateScoreBreakdown candidate={selectedCandidate} />
            </div>
          )}

          {/* Candidate Pool List */}
          {previewData.ranked_candidates && previewData.ranked_candidates.length > 1 && (
            <div className="mb-3">
              <div className="font-label text-secondary mb-2" style={{ fontSize: '10px' }}>
                ALL CANDIDATES IN POOL ({previewData.ranked_candidates.length})
              </div>
              <div className="vstack gap-1">
                {previewData.ranked_candidates.map((cand, idx) => {
                  const isSelected = cand.technician_id === selectedCandidate?.technician_id;
                  const candScore = cand.total_score != null ? Number(cand.total_score) : 0;
                  return (
                    <div
                      key={cand.technician_id}
                      className={`p-2 rounded border cursor-pointer d-flex justify-content-between align-items-center transition-all ${
                        isSelected
                          ? 'border-primary bg-primary-subtle text-primary fw-bold'
                          : 'border-outline-variant bg-surface hover-bg text-on-surface'
                      }`}
                      style={{ fontSize: '12px' }}
                      onClick={() => setSelectedCandidateId(cand.technician_id)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="font-mono text-secondary">#{cand.rank || idx + 1}</span>
                        <span>{cand.technician_name}</span>
                      </div>
                      <span className="font-mono">{candScore.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Excluded Candidates */}
          {excludedList.length > 0 && (
            <div className="mb-3">
              <div className="font-label text-secondary mb-1" style={{ fontSize: '10px' }}>
                EXCLUDED CANDIDATES ({excludedList.length})
              </div>
              <div className="vstack gap-1">
                {excludedList.map((ex) => {
                  const reasonText = Array.isArray(ex.reasons)
                    ? ex.reasons.join(', ')
                    : ex.reasons || ex.reason || 'Ineligible';
                  return (
                    <div
                      key={ex.technician_id}
                      className="p-1 px-2 bg-surface-container-lowest border rounded d-flex justify-content-between align-items-center"
                      style={{ fontSize: '11px' }}
                    >
                      <span className="text-secondary">{ex.technician_name}</span>
                      <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '9px' }}>
                        {reasonText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dispatch Trigger Button */}
      {canDispatch && previewData?.recommended_technician && (
        <div className="pt-2 border-top border-outline-variant mt-auto">
          <Button
            variant="primary"
            className="w-100 justify-content-center"
            onClick={handleDispatch}
            loading={dispatching}
          >
            <span>Dispatch Offer to Top Specialist</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              send
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
