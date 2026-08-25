import React from 'react';
import { Link } from 'react-router-dom';

export default function TopHeader({ onToggleSidebar }) {
  return (
    <header className="app-header">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="d-flex align-items-center gap-3 w-50">
        <button
          type="button"
          className="btn btn-sm btn-link d-md-none text-on-surface p-0 d-flex align-items-center"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            menu
          </span>
        </button>

        <div className="position-relative w-100 d-none d-sm-block" style={{ maxWidth: '300px' }}>
          <span
            className="material-symbols-outlined position-absolute text-secondary"
            style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}
          >
            search
          </span>
          <input
            type="text"
            className="form-control form-control-sm bg-surface-container-low border-0 ps-4 text-on-surface"
            style={{ fontSize: '13px', borderRadius: 'var(--radius-md)' }}
            placeholder="Search tickets, technicians..."
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="d-flex align-items-center gap-2">
        <Link to="/tickets/new" className="btn-sh-primary btn-sm text-decoration-none">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            add
          </span>
          <span>+ New Ticket</span>
        </Link>
      </div>
    </header>
  );
}
