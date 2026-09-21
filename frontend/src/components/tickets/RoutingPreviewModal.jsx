import React, { useEffect, useState } from 'react';
import ModalDialog from '../common/ModalDialog';
import Button from '../common/Button';
import SkeletonLoader from '../common/SkeletonLoader';
import { routingApi } from '../../api/routing';

export default function RoutingPreviewModal({ isOpen, onClose, ticketId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (isOpen && ticketId) {
      loadPreview();
    }
  }, [isOpen, ticketId]);

  async function loadPreview() {
    try {
      setLoading(true);
      setError(null);
      const data = await routingApi.previewRouting(ticketId);
      setPreviewData(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate deterministic routing preview.');
    } finally {
      setLoading(false);
    }
  }

  const recommended = previewData?.recommended_technician || previewData?.recommended_candidate;
  const topCandidate = previewData?.ranked_candidates?.[0];
  const breakdown = topCandidate?.score_breakdown;
  const excludedList = previewData?.excluded_candidates || previewData?.excluded_technicians || [];
  const eligibleCount = previewData?.eligible_count ?? previewData?.eligible_technicians_count ?? previewData?.ranked_candidates?.length ?? 0;

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Deterministic Routing Engine Analysis"
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close Preview
        </Button>
      }
    >
      {loading && <SkeletonLoader type="card" count={2} />}

      {!loading && error && (
        <div className="alert alert-danger p-3 small d-flex align-items-start gap-2">
          <span className="material-symbols-outlined text-danger">error</span>
          <div>
            <strong>Routing Evaluation Error:</strong> {error}
          </div>
        </div>
      )}

      {!loading && !error && previewData && (
        <div>
          {/* Header Summary */}
          <div className="p-3 bg-surface-container-low rounded-2 mb-3 border border-outline-variant">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="font-label text-secondary" style={{ fontSize: '11px' }}>
                SERVICE CATEGORY: <strong>{previewData.ticket_category || previewData.service_category_name || 'General'}</strong>
              </span>
              <span className="badge bg-primary-subtle text-primary font-mono" style={{ fontSize: '11px' }}>
                {eligibleCount} Eligible Candidates
              </span>
            </div>
            <div className="text-secondary small">
              Evaluated location, active workload, star rating, customer history, and reliability.
            </div>
          </div>

          {/* Recommended Candidate */}
          {recommended ? (
            <div className="sh-card bg-white border-2 border-primary mb-4 p-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
                    style={{ width: '40px', height: '40px' }}
                  >
                    1
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h4 className="h6 font-headline text-on-surface mb-0">
                        {recommended.technician_name}
                      </h4>
                      <span className="badge bg-success text-white font-label" style={{ fontSize: '10px' }}>
                        TOP RECOMMENDATION
                      </span>
                    </div>
                    <div className="text-secondary small font-mono">
                      Domain: {previewData.ticket_category || 'General'}
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <div className="font-label text-secondary" style={{ fontSize: '10px' }}>
                    TOTAL SCORE
                  </div>
                  <div className="font-mono display-6 fw-bold text-primary" style={{ fontSize: '24px' }}>
                    {(recommended.total_score != null ? Number(recommended.total_score) : 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Score Breakdown (5 Factors) */}
              <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant mt-3">
                <div className="font-label text-secondary mb-2" style={{ fontSize: '10px' }}>
                  5-FACTOR WEIGHTED SCORING BREAKDOWN
                </div>
                <div className="row g-2 font-mono small" style={{ fontSize: '11px' }}>
                  <div className="col-6 col-md">
                    <div className="text-secondary">Proximity (20 pts)</div>
                    <div className="fw-bold">{(breakdown?.location ?? topCandidate?.location_score ?? 0).toFixed(1)}</div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="text-secondary">Rating (25 pts)</div>
                    <div className="fw-bold">{(breakdown?.rating ?? topCandidate?.rating_score ?? 0).toFixed(1)}</div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="text-secondary">History (25 pts)</div>
                    <div className="fw-bold">{(breakdown?.customer_history ?? topCandidate?.history_score ?? 0).toFixed(1)}</div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="text-secondary">Reliability (15 pts)</div>
                    <div className="fw-bold">{(breakdown?.reopen_rate ?? topCandidate?.reopen_score ?? 0).toFixed(1)}</div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="text-secondary">Workload (15 pts)</div>
                    <div className="fw-bold">{(breakdown?.workload ?? topCandidate?.workload_score ?? 0).toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning p-3 small mb-3">
              No eligible on-duty technicians currently meet the skill and workload requirements for this ticket.
            </div>
          )}

          {/* Ranked Candidates Table */}
          {previewData.ranked_candidates && previewData.ranked_candidates.length > 1 && (
            <div className="mb-4">
              <div className="font-label text-secondary mb-2" style={{ fontSize: '11px' }}>
                ALL RANKED CANDIDATES ({previewData.ranked_candidates.length})
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '12px' }}>
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th style={{ width: '50px' }} className="text-center">Rank</th>
                      <th>Technician</th>
                      <th className="text-end" style={{ width: '100px' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.ranked_candidates.map((cand, idx) => (
                      <tr key={cand.technician_id}>
                        <td className="fw-bold text-center">
                          #{cand.rank || idx + 1}
                        </td>
                        <td>
                          <div className="fw-semibold">{cand.technician_name}</div>
                        </td>
                        <td className="font-mono fw-bold text-primary text-end">
                          {(cand.total_score != null ? Number(cand.total_score) : 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Excluded Candidates */}
          {excludedList.length > 0 && (
            <div>
              <div className="font-label text-secondary mb-2" style={{ fontSize: '11px' }}>
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
                      className="p-2 bg-surface-container-lowest border rounded d-flex justify-content-between align-items-center small"
                      style={{ fontSize: '12px' }}
                    >
                      <span>{ex.technician_name}</span>
                      <span className="badge bg-secondary-subtle text-secondary font-label" style={{ fontSize: '10px' }}>
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
    </ModalDialog>
  );
}
