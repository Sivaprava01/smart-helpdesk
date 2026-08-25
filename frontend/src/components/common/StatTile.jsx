import React from 'react';

export default function StatTile({
  title,
  value,
  subtitle = null,
  icon = null,
  badge = null,
  accentColor = 'primary', // 'primary', 'warning', 'success', 'danger', 'info'
  onClick = null,
  className = '',
}) {
  let borderLeft = '4px solid var(--color-primary)';
  if (accentColor === 'warning') borderLeft = '4px solid #f59e0b';
  if (accentColor === 'success') borderLeft = '4px solid #10b981';
  if (accentColor === 'danger') borderLeft = '4px solid #ef4444';
  if (accentColor === 'info') borderLeft = '4px solid #0058be';

  return (
    <div
      className={`sh-card p-3 bg-white d-flex flex-column justify-content-between h-100 ${
        onClick ? 'cursor-pointer hover-lift' : ''
      } ${className}`}
      style={{ borderLeft }}
      onClick={onClick}
    >
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span className="font-label text-secondary" style={{ fontSize: '11px' }}>
          {title}
        </span>
        {icon && (
          <span
            className={`material-symbols-outlined text-${accentColor}`}
            style={{ fontSize: '20px' }}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="d-flex align-items-baseline gap-2 mb-1">
        <span className="font-headline display-6 fw-bold text-on-surface" style={{ fontSize: '28px' }}>
          {value}
        </span>
        {badge && <span>{badge}</span>}
      </div>

      {subtitle && (
        <div className="text-secondary small font-body" style={{ fontSize: '12px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
