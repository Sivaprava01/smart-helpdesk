import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon = 'inbox',
  title = 'No records found',
  description = 'There are no items matching the selected criteria.',
  actionLabel = null,
  onAction = null,
  actionIcon = null,
  className = '',
}) {
  return (
    <div className={`sh-card text-center py-5 px-4 my-3 ${className}`}>
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 bg-surface-container-high text-primary"
        style={{ width: '64px', height: '64px' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
          {icon}
        </span>
      </div>
      <h3 className="h5 font-headline text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant mx-auto mb-4" style={{ maxWidth: '420px', fontSize: '14px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
