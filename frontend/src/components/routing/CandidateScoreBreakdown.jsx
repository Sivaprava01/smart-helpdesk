import React from 'react';

/**
 * Visual breakdown of the 5-factor deterministic routing formula:
 * Total Score = Location(20 max) + Rating(25 max) + Customer History(25 max) + Reopen Rate(15 max) + Workload(15 max)
 */
export default function CandidateScoreBreakdown({ candidate }) {
  if (!candidate) return null;

  const breakdown = candidate.score_breakdown || {};
  const totalScore = candidate.total_score != null ? Number(candidate.total_score) : 0;

  const factors = [
    {
      label: 'Proximity',
      weight: '20%',
      raw: breakdown.location != null ? breakdown.location : candidate.location_score,
      max: 20,
      icon: 'near_me',
      desc: 'Zone affinity & location match',
    },
    {
      label: 'Overall Rating',
      weight: '25%',
      raw: breakdown.rating != null ? breakdown.rating : candidate.rating_score,
      max: 25,
      icon: 'star',
      desc: 'Customer historical star rating',
    },
    {
      label: 'Customer History',
      weight: '25%',
      raw: breakdown.customer_history != null ? breakdown.customer_history : candidate.history_score,
      max: 25,
      icon: 'handshake',
      desc: 'Previous successful visits to resident',
    },
    {
      label: 'Reliability',
      weight: '15%',
      raw: breakdown.reopen_rate != null ? breakdown.reopen_rate : candidate.reopen_score,
      max: 15,
      icon: 'verified',
      desc: 'Low reopen rate track record',
    },
    {
      label: 'Workload Capacity',
      weight: '15%',
      raw: breakdown.workload != null ? breakdown.workload : candidate.workload_score,
      max: 15,
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
          Total: {totalScore.toFixed(2)} / 100
        </span>
      </div>

      <div className="vstack gap-2">
        {factors.map((f) => {
          const scoreValue = f.raw != null ? Number(f.raw) : 0;
          const pct = f.max > 0 ? Math.min(100, Math.max(0, (scoreValue / f.max) * 100)) : 0;

          let barColor = 'bg-primary';
          if (pct >= 80) barColor = 'bg-success';
          else if (pct < 50) barColor = 'bg-warning';

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
                  {scoreValue.toFixed(1)} / {f.max}
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
