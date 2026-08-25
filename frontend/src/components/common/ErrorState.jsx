import React from 'react';
import Button from './Button';

export default function ErrorState({
  title = 'Unable to load data',
  message = 'An error occurred while communicating with the server. Please try again.',
  onRetry = null,
  className = '',
}) {
  return (
    <div className={`sh-card border-danger text-center py-5 px-4 my-3 bg-white ${className}`}>
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 bg-danger-subtle text-danger"
        style={{ width: '56px', height: '56px' }}
      >
        <span className="material-symbols-outlined text-danger" style={{ fontSize: '30px' }}>
          error_outline
        </span>
      </div>
      <h3 className="h5 font-headline text-danger mb-2">{title}</h3>
      <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '440px', fontSize: '14px' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" icon="refresh" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
