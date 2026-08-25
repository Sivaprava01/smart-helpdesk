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
                SERVICE CATEGORY: <strong>{previewData.service_category_name || 'General'}</strong>
              </span>
              <span className="badge bg-primary-subtle text-primary font-mono" style={{ fontSize: '11px' }}>
                {previewData.eligible_technicians_count} Eligible Candidates
              </span>
            </div>
            <div className="text-secondary small">
              Evaluated location, active workload, star rating, customer history, and reliability.
            </div>
          </div>

          {/* Recommended Candidate */}
          {previewData.recommended_candidate ? (
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
                        {previewData.recommended_candidate.technician_name}
                      </h4>
                      <span className="badge bg-success text-white font-label" style={{ fontSize: '10px' }}>
                        TOP RECOMMENDATION
                      </span>
                    </div>
                    <div className="text-secondary small font-mono">
                      Zone: {previewData.recommended_candidate.current_zone || 'Tower A'}
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <div className="font-label text-secondary" style={{ fontSize: '10px' }}>
                    TOTAL SCORE
                  </div>
                  <div className="font-mono display-6 fw-bold text-primary" style={{ fontSize: '24px' }}>
                    {previewData.recommended_candidate.total_score.toFixed(2)}
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
                    <div className="text-secondary">Proximity (20%)</div>
                    <div className="fw-bold">{previewData.recommended_candidate.location_score?.toFixed(1) || '0.0'}</div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="text-secondary">Rating (25%)</div>
                    <div className="fw-bold">{previewData.recommended_candidate.rating_score?.toFixed(1) || '0.0'}</div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="text-secondary">History (25%)</div>
                    <div className="fw-bold">{previewData.recommended_candidate.history_score?.toFixed(1) || '0.0'}</div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="text-secondary">Reliability (15%)</div>
                    <div className="fw-bold">{previewData.recommended_candidate.reopen_score?.toFixed(1) || '0.0'}</div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="text-secondary">Workload (15%)</div>
                    <div className="fw-bold">{previewData.recommended_candidate.workload_score?.toFixed(1) || '0.0'}</div>
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
                ALL RANKED CANDIDATES
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0" style={{ fontSize: '12px' }}>
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th>Rank</th>
                      <th>Technician</th>
                      <th>Zone</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.ranked_candidates.map((cand, idx) => (
                      <tr key={cand.technician_id}>
                        <td className="fw-bold text-center" style={{ width: '45px' }}>
                          #{idx + 1}
                        </td>
                        <td>{cand.technician_name}</td>
                        <td>{cand.current_zone || 'Tower A'}</td>
                        <td className="font-mono fw-bold text-primary">{cand.total_score.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Excluded Technicians */}
          {previewData.excluded_technicians && previewData.excluded_technicians.length > 0 && (
            <div>
              <div className="font-label text-secondary mb-2" style={{ fontSize: '11px' }}>
                EXCLUDED CANDIDATES ({previewData.excluded_technicians.length})
              </div>
              <div className="vstack gap-1">
                {previewData.excluded_technicians.map((ex) => (
                  <div
                    key={ex.technician_id}
                    className="p-2 bg-surface-container-lowest border rounded d-flex justify-content-between align-items-center small"
                    style={{ fontSize: '12px' }}
                  >
                    <span>{ex.technician_name}</span>
                    <span className="badge bg-secondary-subtle text-secondary font-label" style={{ fontSize: '10px' }}>
                      {ex.reason || 'Off Duty / Capacity Reached'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ModalDialog>
  );
}
