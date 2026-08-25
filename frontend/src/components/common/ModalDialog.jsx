import React, { useEffect } from 'react';

export default function ModalDialog({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  let maxWidth = '540px';
  if (size === 'sm') maxWidth = '400px';
  if (size === 'lg') maxWidth = '720px';
  if (size === 'xl') maxWidth = '900px';

  return (
    <div
      className="modal-backdrop-custom d-flex align-items-center justify-content-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 28, 48, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="sh-card bg-white p-0 overflow-hidden shadow-lg"
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-outline-variant bg-surface-container-low">
          <h2 className="h6 font-headline text-on-surface mb-0">{title}</h2>
          <button
            type="button"
            className="btn btn-sm btn-link text-on-surface-variant p-0 d-flex align-items-center text-decoration-none"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 overflow-auto" style={{ flex: '1 1 auto' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 border-top border-outline-variant bg-surface-container-low d-flex justify-content-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
