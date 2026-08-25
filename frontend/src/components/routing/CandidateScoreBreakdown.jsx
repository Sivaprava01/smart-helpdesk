import React from 'react';

/**
 * Visual breakdown of the 5-factor deterministic routing formula:
 * Total Score = (Location * 0.20) + (Rating * 0.25) + (History * 0.25) + (Reopen * 0.15) + (Workload * 0.15)
 */
export default function CandidateScoreBreakdown({ candidate }) {
  if (!candidate) return null;

  const factors = [
    {
      label: 'Proximity',
      weight: '20%',
      raw: candidate.location_score,
      max: 100,
      icon: 'near_me',
      desc: 'Zone affinity & location match',
    },
    {
      label: 'Overall Rating',
      weight: '25%',
      raw: candidate.rating_score,
      max: 100,
      icon: 'star',
      desc: 'Customer historical star rating',
    },
    {
      label: 'Customer History',
      weight: '25%',
      raw: candidate.history_score,
      max: 100,
      icon: 'handshake',
      desc: 'Previous successful visits to resident',
    },
    {
      label: 'Reliability',
      weight: '15%',
      raw: candidate.reopen_score,
      max: 100,
      icon: 'verified',
      desc: 'Low reopen rate track record',
    },
    {
      label: 'Workload Capacity',
      weight: '15%',
      raw: candidate.workload_score,
      max: 100,
      icon: 'speed',
      desc: 'Available capacity vs concurrent max',
    },
  ];

  return (
    <div className="sh-card bg-surface-container-lowest p-3 border border-outline-variant rounded-2">
      <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-outline-variant">
        <span className="font-label text-secondary" style={{ fontSize: '11px' }}>
          5-FACTOR DETERMINISTIC SCORING FORMULA
        </span>
        <span className="font-mono text-primary fw-bold small">
          Total: {candidate.total_score.toFixed(2)} / 100
        </span>
      </div>

      <div className="vstack gap-2">
        {factors.map((f) => {
          const scoreValue = f.raw != null ? Number(f.raw) : 0;
          const pct = Math.min(100, Math.max(0, scoreValue));

          let barColor = 'bg-primary';
          if (scoreValue >= 80) barColor = 'bg-success';
          else if (scoreValue < 50) barColor = 'bg-warning';

          return (
            <div key={f.label} className="small">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center gap-1">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: '15px' }}>
                    {f.icon}
                  </span>
                  <span className="fw-semibold text-on-surface" style={{ fontSize: '12px' }}>
                    {f.label}
                  </span>
                  <span className="text-secondary font-label" style={{ fontSize: '10px' }}>
                    ({f.weight})
                  </span>
                </div>
                <span className="font-mono fw-bold text-on-surface" style={{ fontSize: '12px' }}>
                  {scoreValue.toFixed(1)}
                </span>
              </div>

              <div className="progress" style={{ height: '5px' }}>
                <div
                  className={`progress-bar ${barColor}`}
                  role="progressbar"
                  style={{ width: `${pct}%` }}
                  aria-valuenow={pct}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
