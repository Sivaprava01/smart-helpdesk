import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((message, title = 'Success') => {
    addToast({ title, message, type: 'success' });
  }, [addToast]);

  const showError = useCallback((message, title = 'Error') => {
    addToast({ title, message, type: 'error' });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Notice') => {
    addToast({ title, message, type: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showInfo }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: '100%',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="sh-card bg-white shadow-lg p-3 d-flex align-items-start gap-3 border"
            style={{
              borderRadius: 'var(--radius-md)',
              borderLeft: `4px solid ${
                toast.type === 'success'
                  ? 'var(--color-status-closed-text)'
                  : toast.type === 'error'
                  ? 'var(--color-error)'
                  : 'var(--color-primary)'
              }`,
            }}
          >
            <span
              className={`material-symbols-outlined ${
                toast.type === 'success'
                  ? 'text-success'
                  : toast.type === 'error'
                  ? 'text-danger'
                  : 'text-primary'
              }`}
              style={{ fontSize: '22px' }}
            >
              {toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'error'
                ? 'error'
                : 'info'}
            </span>
            <div className="flex-grow-1">
              {toast.title && (
                <div className="font-headline text-on-surface fw-semibold" style={{ fontSize: '13px' }}>
                  {toast.title}
                </div>
              )}
              <div className="text-secondary" style={{ fontSize: '13px', lineHeight: '1.4' }}>
                {toast.message}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link text-secondary p-0"
              onClick={() => removeToast(toast.id)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                close
              </span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
